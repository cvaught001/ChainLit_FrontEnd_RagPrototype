# Deployment Context (Northstar Chainlit Frontend)

## Repo + Docker image
- Repo: `/Users/christophervaught/projects/ChainLit_FrontEnd_RagPrototype`
- Image: `northsttaracr.azurecr.io/northstar-rag-frontend:latest`
- App port: `8001`
- API base: `http://hotel_rag_api:8000` (internal Docker network)
- API path: `/ai/query`

## SSH to VM
```
ssh -i ./dev-northstar-db-vm_key.pem azureuser@20.171.96.40
```

## VM prerequisites
```
# Docker running?
sudo systemctl status docker

# Docker network used by API container
sudo docker network ls | grep hotel_rag_net || sudo docker network create hotel_rag_net
```

## Build + push image (from Mac)
```
# Build amd64 image and push to ACR
# (use buildx to avoid arm64 image on amd64 VM)
docker buildx create --name nsbuilder --use

docker buildx build --platform linux/amd64 \
  -t northsttaracr.azurecr.io/northstar-rag-frontend:latest \
  --push .
```

## Build image on VM (if repo is there)
```
cd ~/ChainLit_FrontEnd_RagPrototype
sudo docker build -t northsttaracr.azurecr.io/northstar-rag-frontend:latest .
sudo docker push northsttaracr.azurecr.io/northstar-rag-frontend:latest
```

## Run on VM
```
sudo docker rm -f chainlit-frontend
sudo docker run -d --name chainlit-frontend \
  --network hotel_rag_net \
  -e API_BASE_URL=http://hotel_rag_api:8000 \
  -p 8001:8001 \
  northsttaracr.azurecr.io/northstar-rag-frontend:latest
```

## Avoid DNS issues (recommended)
Use docker compose with an explicit `API_BASE_URL` that matches the API container name.

```
cd ~/ChainLit_FrontEnd_RagPrototype
export API_BASE_URL=http://northstar-api:8000
sudo docker compose up -d --build
```

If you control the API container, prefer naming it `hotel_rag_api` and attaching it to
`hotel_rag_net`, then keep `API_BASE_URL=http://hotel_rag_api:8000`.

### If you hit this error
`Request failed: [Errno -3] Temporary failure in name resolution`

Fix it by setting `API_BASE_URL` to the actual API container name or by adding a network alias:

```
# Option A: point to the real container name
export API_BASE_URL=http://northstar-api:8000
sudo docker-compose up -d --build
```

```
# Option B: add an alias so hotel_rag_api resolves
sudo docker network disconnect hotel_rag_net northstar-api
sudo docker network connect --alias hotel_rag_api hotel_rag_net northstar-api
```

## Make API container reachable by name
The API container is currently named `northstar-api` on the VM.
To make `hotel_rag_api` resolve in the Chainlit container:
```
sudo docker network connect --alias hotel_rag_api hotel_rag_net northstar-api
```

## Verify
```
# Frontend
curl http://localhost:8001

# API from inside Chainlit container
sudo docker exec -it chainlit-frontend sh -lc \
'python - <<PY
import socket
print(socket.gethostbyname("hotel_rag_api"))
PY'
```

## Azure networking
- Open inbound port **8001** on NSG for `dev-northstar-db-vm`.
- External URL: `http://20.171.96.40:8001`

## Troubleshooting
- `exec format error`: arm64 image on amd64 VM. Rebuild amd64 with buildx.
- `docker: permission denied`: use `sudo` or add user to docker group.
- API calls not hitting: check network alias + `API_BASE_URL` env.
