#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting Up2Skills Studio Platform ==="

# 1. Start Ollama service in background
echo "Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be available
echo "Waiting for Ollama API to be ready..."
until curl -s http://127.0.0.1:11434/api/tags > /dev/null; do
  sleep 1
done
echo "Ollama is ready!"

# 2. Start FastAPI Backend in background
echo "Starting Python FastAPI Backend..."
cd /app/api
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd /app

# Wait for Backend to be available
echo "Waiting for Backend API to be ready..."
until curl -s http://127.0.0.1:8000/ > /dev/null; do
  sleep 1
done
echo "FastAPI Backend is ready!"

# 3. Start Next.js Frontend
echo "Starting Next.js Frontend..."
npm run start -- -p 3000 &
FRONTEND_PID=$!

# Handle shutdown signals
cleanup() {
    echo "Shutting down services..."
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    kill -TERM "$OLLAMA_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$OLLAMA_PID" 2>/dev/null || true
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for all background tasks
wait
