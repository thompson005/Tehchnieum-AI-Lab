# syntax=docker/dockerfile:1
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc g++ postgresql-client && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt requirements.txt
# Force CPU-only torch to avoid 5-8 GB NVIDIA CUDA packages on EC2
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
COPY backend/services/agent_core/ .
EXPOSE 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]
