# syntax=docker/dockerfile:1
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY backend/requirements-agent.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/services/agent_core/ .
EXPOSE 8003
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
