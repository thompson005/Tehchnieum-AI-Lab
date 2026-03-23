# syntax=docker/dockerfile:1
FROM python:3.11-slim

WORKDIR /app

# Minimal system deps for the gateway (no compiler needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Use slim gateway-only requirements (avoids installing torch/ML packages)
COPY requirements-gateway.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the gateway entry point
COPY main.py .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the gateway
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
