FROM python:3.11-slim
WORKDIR /app
COPY requirements-ai-agent.txt requirements.txt
# Force CPU-only torch to avoid 5-8 GB NVIDIA CUDA packages on EC2
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
COPY ai_agent/main.py .
COPY ai_agent/rag_setup.py .
EXPOSE 9000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
