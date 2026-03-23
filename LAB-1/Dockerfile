# syntax=docker/dockerfile:1
# MedAssist AI - Dockerfile

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_HOST=0.0.0.0 \
    FLASK_PORT=5000

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Force CPU-only torch to avoid 5-8 GB NVIDIA CUDA packages on EC2
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

# Install Python dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p database rag/chroma_db

# Initialize database
RUN python setup_database.py

# Expose Flask port
EXPOSE 5000

# Simple health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run the application
CMD ["python", "app.py"]
