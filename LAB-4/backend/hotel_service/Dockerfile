FROM python:3.11-slim
WORKDIR /app
COPY requirements-base.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY hotel_service/main.py .
EXPOSE 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
