#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================================="
echo " Starting Up2Skills Studio Setup & Run (Lightning.ai Mode)"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Install system requirements if possible
if command -v apt-get &> /dev/null; then
    echo "Checking system requirements (libmagic-dev, pandoc)..."
    if ! dpkg -s libmagic-dev &> /dev/null || ! command -v pandoc &> /dev/null; then
        echo "Installing system packages..."
        sudo apt-get update && sudo apt-get install -y libmagic-dev pandoc || echo "Warning: apt-get failed. Proceeding anyway."
    fi
fi

# 2. Check/Start Ollama
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Check if Ollama service is already running, if not start it in background
if curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    echo "Ollama service is already running."
else
    echo "Starting Ollama service..."
    ollama serve > ollama.log 2>&1 &
    OLLAMA_PID=$!
    
    echo "Waiting for Ollama to be ready..."
    until curl -s http://127.0.0.1:11434/api/tags > /dev/null; do
      sleep 1
    done
fi

# 3. Pull required Ollama models if they aren't downloaded yet
echo "Verifying Ollama models..."
ollama pull mistral
ollama pull nomic-embed-text

# 4. Install Python dependencies directly in active Lightning environment
echo "Installing python dependencies..."
pip install --upgrade pip || true
pip install -r api/requirements.txt

# 5. Pre-download Hugging Face and NLTK models
echo "Pre-downloading embedding and NLTK models..."
python3 api/download_models.py

# 6. Install Node dependencies and build frontend
echo "Installing Node.js packages..."
npm install

echo "Building frontend for production..."
npm run build

# 7. Start FastAPI Backend in background
echo "Starting FastAPI Backend..."
cd api
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for FastAPI backend to be ready..."
until curl -s http://127.0.0.1:8000/ > /dev/null; do
  sleep 1
done
echo "Backend is ready!"

# 8. Start Frontend in foreground
echo "Starting Next.js Frontend..."
npm run start -- -p 3000 &
FRONTEND_PID=$!

# Trap shutdown signals to terminate background processes
cleanup() {
    echo "Shutting down processes..."
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    if [ ! -z "$OLLAMA_PID" ]; then
        kill -TERM "$OLLAMA_PID" 2>/dev/null || true
    fi
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "=========================================================="
echo " Up2Skills Studio is running!"
echo " Frontend URL: http://localhost:3000"
echo " Backend URL:  http://localhost:8000"
echo " Press Ctrl+C to terminate all services."
echo "=========================================================="

wait
