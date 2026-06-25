# Use python 3.10-slim as the base image
FROM python:3.10-slim-bookworm

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV HF_HOME=/root/.cache/huggingface
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies, including Node.js and libraries for unstructured
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    git \
    libmagic-dev \
    pandoc \
    procps \
    zstd \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set up working directory
WORKDIR /app

# Copy package files and install frontend dependencies first for caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy requirements.txt and install Python dependencies
COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy the download script and pre-download Hugging Face and NLTK models
COPY api/download_models.py ./api/download_models.py
RUN python api/download_models.py

# Pre-download Ollama models (mistral and nomic-embed-text)
# We start Ollama daemon temporarily during the build to run "ollama pull"
RUN ollama serve & \
    OLLAMA_PID=$! && \
    until curl -s http://localhost:11434/api/tags > /dev/null; do sleep 1; done && \
    echo "Pulling mistral model..." && \
    ollama pull mistral && \
    echo "Pulling nomic-embed-text model..." && \
    ollama pull nomic-embed-text && \
    kill $OLLAMA_PID && \
    wait $OLLAMA_PID 2>/dev/null || true

# Copy the remaining project codebase
COPY . .

# Build the Next.js application
RUN npm run build

# Make the docker-entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

# Expose ports for next.js frontend (3000) and fastapi backend (8000)
EXPOSE 3000
EXPOSE 8000

# Run entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
