FROM python:3.11-slim
WORKDIR /app
COPY requirements-ai-agent.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY ai_agent/main.py .
COPY ai_agent/rag_setup.py .
EXPOSE 9000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
