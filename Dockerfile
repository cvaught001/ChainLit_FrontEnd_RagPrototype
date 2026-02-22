FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
ARG APP_VERSION=dev-local

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./
RUN sed -i "s/__APP_VERSION__/${APP_VERSION}/g" /app/public/custom.js

EXPOSE 8001

CMD ["chainlit", "run", "app.py", "--host", "0.0.0.0", "--port", "8001"]
