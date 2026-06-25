#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================================="
echo " Starting Up2Skills Studio Setup & Run Script"
echo "=========================================================="

# Ensure script is run from root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check for required system packages
echo "--> Checking system dependencies..."
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is required but not installed." >&2
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: Node.js (v18+) is required but not installed." >&2
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed." >&2
    exit 1
fi

# Detect system package manager for optional installations (unstructured requirements)
if command -v apt-get &> /dev/null; then
    echo "System package manager 'apt-get' detected."
    # Check for libmagic and pandoc
    if ! dpkg -s libmagic-dev &> /dev/null || ! command -v pandoc &> /dev/null; then
        echo "Installing system packages for document loading (libmagic-dev, pandoc)..."
        sudo apt-get update && sudo apt-get install -y libmagic-dev pandoc
    fi
fi

# 2. Setup/Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "--> Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "--> Ollama is already installed."
fi

# 3. Start Ollama and pull models
echo "--> Starting Ollama service in the background..."
ollama serve > ollama.log 2>&1 &
OLLAMA_PID=$!

echo "Waiting for Ollama to be ready..."
until curl -s http://127.0.0.1:11434/api/tags > /dev/null; do
  sleep 1
done
echo "Ollama is ready!"

echo "--> Pulling Ollama models..."
echo "Pulling mistral (this may take a few minutes)..."
ollama pull mistral
echo "Pulling nomic-embed-text..."
ollama pull nomic-embed-text

# 4. Setup Python Virtual Environment and dependencies
echo "--> Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
echo "Installing python dependencies..."
pip install -r api/requirements.txt

# 5. Pre-download Hugging Face and NLTK models
echo "--> Pre-downloading embedding, re-ranking, and NLTK models..."
python api/download_models.py

# 6. Install Node.js dependencies and build frontend
echo "--> Installing Node.js dependencies..."
npm install
echo "Building frontend for production..."
npm run build

# 7. Start FastAPI Backend in background
echo "--> Starting FastAPI Backend..."
cd api
../.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for FastAPI backend to be ready..."
until curl -s http://127.0.0.1:8000/ > /dev/null; do
  sleep 1
done
echo "FastAPI Backend is ready!"

# 8. Start Frontend in foreground
echo "--> Starting Next.js Frontend..."
npm run start -- -p 3000 &
FRONTEND_PID=$!

# Trap shutdown signals to terminate background processes
cleanup() {
    echo "Shutting down processes..."
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    kill -TERM "$OLLAMA_PID" 2>/dev/null || true
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
