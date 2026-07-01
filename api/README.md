# 🎓 RAG-based Course Chatbot (Local Ollama)

This is a RAG (Retrieval-Augmented Generation) chatbot designed for students and educators to query course materials directly. It runs entirely locally using **Ollama**.

## 🚀 Features
- **File Upload**: Support for PDF, PPTX, and TXT files.
- **Intelligent Retrieval**: Uses local Ollama embeddings and ChromaDB.
- **Contextual Conversation**: Remembers chat history for follow-up questions.
- **Source Transparency**: Shows exactly where the information came from.
- **100% Local**: No data leaves your machine.

## 🛠️ Setup

1. **Install Ollama**:
   Download and install Ollama from [ollama.com](https://ollama.com).

2. **Download Models**:
   ```bash
   ollama pull mistral
   ollama pull nomic-embed-text
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Pre-download Models (Hugging Face & NLTK)**:
   ```bash
   python3 download_models.py
   ```

5. **Run the Backend API**:
   You can run the backend API server locally using Uvicorn:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Alternatively, you can run it via Python module:
   ```bash
   python3 -m uvicorn app.main:app --reload --port 8000
   ```
   The backend API will start at `http://localhost:8000`, and its interactive Swagger documentation will be available at `http://localhost:8000/docs`.

## 📂 Project Structure
- [app/](file:///home/pro/rag/api/app): The FastAPI web application directory.
  - [main.py](file:///home/pro/rag/api/app/main.py): Entry point for the FastAPI backend.
  - [api/](file:///home/pro/rag/api/app/api): Router endpoints (notebooks, documents, chats, quizzes, assignments).
  - [db/](file:///home/pro/rag/api/app/db): Session management and database models.
  - [services/](file:///home/pro/rag/api/app/services): RAG and LLM query orchestration service.
  - [vectorstore/](file:///home/pro/rag/api/app/vectorstore): Chroma vector store interface.
- [main.py](file:///home/pro/rag/api/main.py): Command-line interface for running the chatbot interactively, uploading files, or performing one-off queries.
- [download_models.py](file:///home/pro/rag/api/download_models.py): Script to pre-download Hugging Face models and NLTK resources locally.
- [file_processor.py](file:///home/pro/rag/api/file_processor.py): Document loading and chunking utilities.
- [vector_store.py](file:///home/pro/rag/api/vector_store.py): Direct Chroma DB interaction wrappers.
- [chatbot.py](file:///home/pro/rag/api/chatbot.py): Chatbot history and RAG response helpers.
- [get_embedding_function.py](file:///home/pro/rag/api/get_embedding_function.py): Instantiation helper for embedding functions.
- [requirements.txt](file:///home/pro/rag/api/requirements.txt): Python dependencies.
- [ARCHITECTURE.md](file:///home/pro/rag/api/ARCHITECTURE.md): Technical report detailing workflow and design.
- [backend.md](file:///home/pro/rag/api/backend.md): API endpoints documentation.

## 🧪 Testing
- Interactive CLI / CLI Query: `python3 main.py --query "your question"` or `python3 main.py` for interactive mode.
- Tests: `pytest`

## 📝 Note on PowerPoint Files
PPTX processing requires the `unstructured` library. Ensure you have the necessary system dependencies installed for your OS.
