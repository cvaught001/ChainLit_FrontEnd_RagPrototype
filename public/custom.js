;(() => {
  const STORAGE_KEY = 'northstar_recent_searches'
  const OPEN_KEY = 'northstar_recent_searches_open'
  const MAX_ITEMS = 10
  const PANEL_ID = 'recent-searches-panel'
  const TOGGLE_ID = 'recent-searches-toggle'
  const OPEN_CLASS = 'recent-searches-open'
  const MOBILE_QUERY = '(max-width: 768px)'
  const PAGE_TITLE = 'Northstar RAG Database Chat LLM Demo'

  const getRoot = () =>
    window.cl_shadowRootElement ||
    document.getElementById('cl-shadow-root') ||
    document.body

  const loadItems = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const items = raw ? JSON.parse(raw) : []
      return Array.isArray(items) ? items : []
    } catch (_) {
      return []
    }
  }

  const saveItems = items => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items.slice(0, MAX_ITEMS))
      )
    } catch (_) {
      // ignore storage errors
    }
  }

  const upsertItem = text => {
    if (!text) return
    const items = loadItems().filter(item => item !== text)
    items.unshift(text)
    saveItems(items)
    render(items)
  }

  const ensurePanel = () => {
    const root = getRoot()
    if (!root) return null

    let panel = root.querySelector(`#${PANEL_ID}`)
    if (panel) return panel

    panel = document.createElement('div')
    panel.id = PANEL_ID
    panel.innerHTML = `
      <div class="recent-searches-header">Recent Searches</div>
      <ul class="recent-searches-list"></ul>
    `
    root.appendChild(panel)
    return panel
  }

  const ensureToggle = () => {
    const root = getRoot()
    if (!root) return null

    let btn = root.querySelector(`#${TOGGLE_ID}`)
    if (btn) return btn

    btn = document.createElement('button')
    btn.id = TOGGLE_ID
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Toggle recent searches')
    btn.setAttribute('aria-expanded', 'false')
    btn.innerHTML = '<span class="recent-searches-toggle-icon">RS</span>'
    btn.addEventListener('click', () => {
      const isOpen = !root.classList.contains(OPEN_CLASS)
      setOpenState(isOpen)
    })
    root.appendChild(btn)
    return btn
  }

  const getStoredOpen = () => {
    try {
      const raw = localStorage.getItem(OPEN_KEY)
      if (raw === null) return null
      return raw === 'true'
    } catch (_) {
      return null
    }
  }

  const setStoredOpen = value => {
    try {
      localStorage.setItem(OPEN_KEY, String(!!value))
    } catch (_) {
      // ignore storage errors
    }
  }

  const setOpenState = value => {
    const root = getRoot()
    if (!root) return
    const btn = ensureToggle()
    if (value) {
      root.classList.add(OPEN_CLASS)
    } else {
      root.classList.remove(OPEN_CLASS)
    }
    if (btn) btn.setAttribute('aria-expanded', String(!!value))
    setStoredOpen(!!value)
  }

  const positionToggle = () => {
    const root = getRoot()
    if (!root) return
    const btn = root.querySelector(`#${TOGGLE_ID}`)
    if (!btn) return

    const anchorButton =
      root.querySelector("button[data-testid='sidebar-toggle']") ||
      root.querySelector("[aria-label='Open sidebar']") ||
      root.querySelector("[aria-label='Close sidebar']") ||
      root.querySelector("[aria-label='New Chat']")

    if (anchorButton) {
      const rect = anchorButton.getBoundingClientRect()
      const width = btn.getBoundingClientRect().width || 36
      const gap = 8
      const left = rect.right + gap
      btn.style.left = `${left}px`
      btn.style.top = `${rect.top}px`
    } else {
      btn.style.left = '56px'
      btn.style.top = '11px'
    }
  }

  const syncViewportState = () => {
    const root = getRoot()
    if (!root) return
    ensureToggle()
    const isMobile = window.matchMedia(MOBILE_QUERY).matches
    const stored = getStoredOpen()
    if (stored === null) {
      setOpenState(!isMobile)
    } else {
      setOpenState(stored)
    }
    positionToggle()
  }

  const resolveChatInput = root => {
    const candidates = [
      "[data-testid='chat-input']",
      "[data-testid='message-input']",
      "[data-testid='chat-composer']",
      "[data-testid='composer']",
      "textarea[placeholder]",
      "textarea",
      "input[type='text']",
      "[contenteditable='true']",
      "[role='textbox']"
    ]

    for (const selector of candidates) {
      const node = root.querySelector(selector)
      if (!node) continue
      if (
        node.matches &&
        (node.matches('textarea') ||
          node.matches("input[type='text']") ||
          node.matches("[contenteditable='true']") ||
          node.matches("[role='textbox']"))
      ) {
        return node
      }
      const child = node.querySelector(
        "textarea, input[type='text'], [contenteditable='true'], [role='textbox']"
      )
      if (child) return child
    }

    const docFallback =
      document.querySelector('textarea') ||
      document.querySelector("input[type='text']") ||
      document.querySelector("[contenteditable='true']") ||
      document.querySelector("[role='textbox']")
    return docFallback
  }

  const setChatInputValue = (input, value) => {
    if (!input) return
    input.focus()

    if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
      try {
        document.execCommand('selectAll', false, null)
        document.execCommand('insertText', false, value)
      } catch (_) {
        input.textContent = value
      }
    } else {
      const proto =
        input.tagName === 'TEXTAREA'
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value')
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, value)
      } else {
        input.value = value
      }
    }

    const inputEvent =
      typeof InputEvent === 'function'
        ? new InputEvent('input', {
            bubbles: true,
            composed: true,
            inputType: 'insertText',
            data: value
          })
        : new Event('input', { bubbles: true })
    input.dispatchEvent(inputEvent)
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }))
  }

  const render = items => {
    const panel = ensurePanel()
    if (!panel) return

    const list = panel.querySelector('.recent-searches-list')
    if (!list) return

    list.innerHTML = ''
    items.slice(0, MAX_ITEMS).forEach(item => {
      const li = document.createElement('li')
      li.className = 'recent-search-item'
      li.textContent = item
      li.title = item
      li.addEventListener('click', () => {
        const root = getRoot()
        if (!root) return
        const input = resolveChatInput(root)
        if (!input) return
        input.focus()
        setChatInputValue(input, item)
      })
      list.appendChild(li)
    })
  }

  const extractText = node => {
    if (!node) return ''
    const text = (node.textContent || '').trim()
    return text
  }

  const handleUserMessage = node => {
    const text = extractText(node)
    if (!text) return
    upsertItem(text)
  }

  const initObserver = () => {
    document.title = PAGE_TITLE
    const root = getRoot()
    if (!root) return

    ensureToggle()
    syncViewportState()
    const media = window.matchMedia(MOBILE_QUERY)
    if (media.addEventListener) {
      media.addEventListener('change', syncViewportState)
    } else if (media.addListener) {
      media.addListener(syncViewportState)
    }
    window.addEventListener('resize', positionToggle)

    render(loadItems())

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue
          if (n.matches && n.matches("[data-step-type='user_message']")) {
            handleUserMessage(n)
            continue
          }
          const userMsg =
            n.querySelector &&
            n.querySelector("[data-step-type='user_message']")
          if (userMsg) handleUserMessage(userMsg)
        }
      }
      positionToggle()
    })

    observer.observe(root, { childList: true, subtree: true })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver)
  } else {
    initObserver()
  }
})()
