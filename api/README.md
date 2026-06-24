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
   pip install streamlit
   ```

4. **Run the App**:
   ```bash
   streamlit run app.py
   ```

## 📂 Project Structure
- `app.py`: The Streamlit web application.
- `chatbot.py`: Logic for the RAG chain and history management using ChatOllama.
- `file_processor.py`: Logic for loading and splitting documents.
- `vector_store.py`: Logic for managing the ChromaDB vector database.
- `get_embedding_function.py`: Configuration for Ollama embeddings.
- `ARCHITECTURE.md`: Detailed technical report on workflow and design.

## 🧪 Testing
- CLI: `python3 main.py --query "your question"`
- Tests: `pytest`

## 📝 Note on PowerPoint Files
PPTX processing requires the `unstructured` library. Ensure you have the necessary system dependencies installed for your OS.
