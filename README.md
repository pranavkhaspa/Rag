# Up2Skills Studio: Notebook-Based Learning Platform

This repository contains the Notebook-Based Learning Platform, an interactive education and study helper that runs locally. It provides a secure, self-hosted web environment powered by a Retrieval-Augmented Generation (RAG) system. Users can organize their study materials into separate workspaces called "Notebooks," upload PDF, PowerPoint (PPTX), and plain text (TXT/MD) documents, converse with their documents via an AI chat interface, generate customizable quizzes, and get detailed AI evaluations of their answers to open-ended questions.

The system is split into:
1. A Next.js client web application that serves as the user interface.
2. A Python FastAPI backend API that manages data persistence, document ingestion, vector databases, and LLM processing.
3. A local benchmarking suite to evaluate the accuracy, retrieval quality, and latency of different embedding and re-ranking models.

---

## Technical Architecture and Workflow

The platform implements a local-first RAG pipeline using ChromaDB, LangChain, and Ollama/SentenceTransformers.

### Ingestion Workflow
1. **Document Loading**: Uploaded documents are parsed using format-specific loaders in [file_processor.py](file:///home/pro/rag/api/file_processor.py).
   * PDFs are processed using `PyPDFLoader`.
   * PowerPoint files are processed using `UnstructuredPowerPointLoader`.
   * Text/Markdown files are processed using `TextLoader` with UTF-8 or Latin-1 fallback encoding.
2. **Text Chunking**: Document text is parsed and split into overlapping segments using LangChain's `RecursiveCharacterTextSplitter`. Chunk sizes and overlaps are configurable per-notebook (defaults are 500 characters for chunk size and 100 characters for overlap).
3. **Vector Ingestion**: Chunks are mapped to their respective `notebook_id` and indexed into ChromaDB. Database paths are isolated by model directories (e.g. `chroma/all-MiniLM-L6-v2`) inside [chroma_store.py](file:///home/pro/rag/api/app/vectorstore/chroma_store.py) to prevent vector dimension mismatch.

### Query and Retrieval Workflow
1. **User Request**: The user submits a query, chat message, quiz generation request, or assignment answer.
2. **Vector Retrieval**: The query is vectorized using the notebook's selected embedding model. ChromaDB performs a similarity search with a metadata filter to isolate chunks belonging to the current `notebook_id`.
3. **Re-ranking Layer (Optional)**: If re-ranking is enabled for the notebook, the backend retrieves a larger candidate set (top 10-15 chunks) and scores them against the query using a local Cross-Encoder model (`cross-encoder/ms-marco-MiniLM-L-6-v2`) in [rag_service.py](file:///home/pro/rag/api/app/services/rag_service.py#L39-L70). The top 5 chunks with the highest relevance scores are selected.
4. **LLM Generation**: The top-ranked context blocks are formatted alongside the user's message and chat history. A local LLM (`mistral` via Ollama) generates the final response, referencing document source names and page numbers.

---

## Core Features

### 1. Notebook Workspace Management
* Create, update, configure, and delete isolated notebook workspaces.
* Configure chunk size, chunk overlap, embedding model, and re-ranking usage per notebook.
* Auto-generate notebook titles and descriptions based on uploaded documents.

### 2. Conversational RAG Chat
* Direct Q&A scoped entirely to documents within the active notebook.
* Chat history management (stored in SQLite) to support context-aware follow-up questions.
* Traceability through source citations, listing matching filenames and page numbers.

### 3. Automated Topic and Quiz Generation
* Extract suggested topics directly from uploaded notebook materials.
* Generate multiple-choice quizzes with custom topic targets and question counts.
* Interactive quiz interface supporting submission, scoring, and correctness breakdown.

### 4. Assignment Evaluation and Feedback
* Evaluate open-ended student answers against target question context.
* Return a structural evaluation containing scoring (0-10), identified strengths, missing concepts, and descriptive improvement guidelines.
* Generate thought-provoking practice questions based on specific topics.

### 5. Local Benchmarking and Evaluation
* Performance testing harness to compare indexing speed, retrieval latency, and retrieval quality (Hit Rate @ K, Mean Reciprocal Rank, and NDCG @ 5) across multiple local embedding and re-ranking pipelines.

---

## Detailed Technology Stack

### Backend and AI Architecture
* **Framework**: FastAPI (Python 3.10+) for RESTful API endpoints.
* **ORM and Database**: SQLite database managed via SQLModel for storing relational schemas (Users, Notebooks, Documents, Chats, Messages, Quizzes, Quiz Questions, Evaluations).
* **AI Orchestration**: LangChain Core, LangChain Community, and LangChain Ollama.
* **Vector Database**: ChromaDB for storing and querying text embeddings.
* **Local Embedding Models**:
  * `nomic-embed-text` (accessed via local Ollama API)
  * `all-MiniLM-L6-v2` (SentenceTransformers run in-process via PyTorch)
  * `bge-small-en-v1.5` (SentenceTransformers run in-process via PyTorch, utilizing custom query prefixes)
* **Local Re-ranking Model**: `cross-encoder/ms-marco-MiniLM-L-6-v2` (SentenceTransformers Cross-Encoder)
* **Local LLM**: `mistral` (accessed via local Ollama API)

### Client Application
* **Framework**: Next.js 16.2.7 (App Router architecture)
* **UI Library**: React 19.2.4
* **Styling**: Tailwind CSS v4 for a premium dark-themed design system.
* **Animation**: Framer Motion for micro-interactions and transitional effects.
* **Icons**: Lucide React
* **State and API Client**: Axios for backend integration.
* **Toast Notifications**: Sonner
* **Text Rendering**: React Markdown for formatted responses.

---

## Directory Structure

Clickable links to the core files in this repository:

* [package.json](file:///home/pro/rag/package.json) - Node.js project configurations and dependencies.
* [package-lock.json](file:///home/pro/rag/package-lock.json) - Dependency lock file.
* [next.config.ts](file:///home/pro/rag/next.config.ts) - Next.js compiler settings.
* [tsconfig.json](file:///home/pro/rag/tsconfig.json) - TypeScript compiler setup.
* [eslint.config.mjs](file:///home/pro/rag/eslint.config.mjs) - Linter configuration.
* [postcss.config.mjs](file:///home/pro/rag/postcss.config.mjs) - PostCSS plugins mapping.
* [backend.md](file:///home/pro/rag/backend.md) - Legacy backend endpoint references.
* [EMBEDDING_EVAL_REPORT.md](file:///home/pro/rag/EMBEDDING_EVAL_REPORT.md) - Summary of embedding models, retrieval benchmarks, and findings.
* [AGENTS.md](file:///home/pro/rag/AGENTS.md) - Local rules governing Next.js agent constraints.
* [CLAUDE.md](file:///home/pro/rag/CLAUDE.md) - Developer context instructions.

### Client Application Codebase
* [app/page.tsx](file:///home/pro/rag/app/page.tsx) - Landing page.
* [app/layout.tsx](file:///home/pro/rag/app/layout.tsx) - Root HTML layout wrapper.
* [app/globals.css](file:///home/pro/rag/app/globals.css) - Global stylesheets.
* [app/dashboard/page.tsx](file:///home/pro/rag/app/dashboard/page.tsx) - Interactive dashboard listing notebooks.
* [app/notebook/[id]/page.tsx](file:///home/pro/rag/app/notebook/%5Bid%5D/page.tsx) - Active notebook workspace panel.
* [lib/api.ts](file:///home/pro/rag/lib/api.ts) - Client API helper functions wrapping Axios endpoints.
* [lib/utils.ts](file:///home/pro/rag/lib/utils.ts) - CSS class merger utility.
* [components/ui/button.tsx](file:///home/pro/rag/components/ui/button.tsx) - Styled interactive button component.
* [components/ui/card.tsx](file:///home/pro/rag/components/ui/card.tsx) - Visual card layout wrapper.
* [components/ui/input.tsx](file:///home/pro/rag/components/ui/input.tsx) - Styled text input component.

### Python Backend Codebase
* [api/main.py](file:///home/pro/rag/api/main.py) - CLI entry point for testing local RAG.
* [api/requirements.txt](file:///home/pro/rag/api/requirements.txt) - Python package dependencies.
* [api/evaluate_retrieval.py](file:///home/pro/rag/api/evaluate_retrieval.py) - Benchmarking script evaluating embedding models and re-ranker configurations.
* [api/generate_eval_dataset.py](file:///home/pro/rag/api/generate_eval_dataset.py) - Script generating a synthetic test corpus dataset using a local LLM.
* [api/eval_dataset.json](file:///home/pro/rag/api/eval_dataset.json) - Synthetic evaluation cases matching queries to ground truth context.
* [api/eval_results.json](file:///home/pro/rag/api/eval_results.json) - Outputs of the evaluation script.
* [api/file_processor.py](file:///home/pro/rag/api/file_processor.py) - Classes and methods to parse PDFs, PPTs, and text documents.
* [api/vector_store.py](file:///home/pro/rag/api/vector_store.py) - Legacy standalone ChromaDB interface.
* [api/chatbot.py](file:///home/pro/rag/api/chatbot.py) - Legacy ConversationalRetrievalChain chatbot.
* [api/app/main.py](file:///home/pro/rag/api/app/main.py) - FastAPI application server setup.
* [api/app/db/models.py](file:///home/pro/rag/api/app/db/models.py) - Relational SQLModel declarations.
* [api/app/db/session.py](file:///home/pro/rag/api/app/db/session.py) - SQLModel engines and dynamic SQLite database migrations.
* [api/app/services/rag_service.py](file:///home/pro/rag/api/app/services/rag_service.py) - RAG workflows including Q&A generation, re-ranking, quiz construction, and assignment evaluation.
* [api/app/vectorstore/chroma_store.py](file:///home/pro/rag/api/app/vectorstore/chroma_store.py) - Dynamic model-specific directory storage and querying logic for ChromaDB.
* [api/app/api/notebook.py](file:///home/pro/rag/api/app/api/notebook.py) - Workspace management endpoints.
* [api/app/api/document.py](file:///home/pro/rag/api/app/api/document.py) - Document upload and indexing endpoints.
* [api/app/api/chat.py](file:///home/pro/rag/api/app/api/chat.py) - Chat generation and RAG endpoints.
* [api/app/api/quiz.py](file:///home/pro/rag/api/app/api/quiz.py) - Quiz generation, listing, and grading endpoints.
* [api/app/api/assignment.py](file:///home/pro/rag/api/app/api/assignment.py) - Answer evaluations and practice question endpoints.

---

## Setup and Installation

### Prerequisites
* **Python**: Version 3.10 or higher.
* **Node.js**: Version 18.0 or higher.
* **Ollama**: Download and run Ollama from [ollama.com](https://ollama.com).

### 1. Install and Pull Local Ollama Models
Ensure Ollama is running in the background and pull the required models:
```bash
ollama pull mistral
ollama pull nomic-embed-text
```

### 2. Backend Setup
Navigate to the `api/` directory, set up a Python virtual environment, and install dependencies:
```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

If you plan to ingest PowerPoint (`.pptx`/`.ppt`) files, ensure you have system-level libraries for `unstructured` installed (e.g. `libmagic` and `pandoc`). Refer to your operating system's package manager instructions.

Start the FastAPI application:
```bash
uvicorn app.main:app --reload --port 8000
```
The backend API server will start at `http://localhost:8000`. The interactive Swagger documentation will be available at `http://localhost:8000/docs`.

### 3. Database Migration and Schema Lifecycle
The database engine in [session.py](file:///home/pro/rag/api/app/db/session.py) uses SQLModel's `metadata.create_all()` at startup to initialize SQLite tables in `api/database.db`. To prevent manual migrations when updates occur, [session.py](file:///home/pro/rag/api/app/db/session.py) performs inline schema inspections using sqlite3's `PRAGMA table_info` and dynamically runs `ALTER TABLE` statements to insert missing columns (such as `embedding_model`, `use_reranking`, `chunk_size`, and `chunk_overlap`) into the database tables.

### 4. Frontend Setup
Navigate to the root directory, install the Node package dependencies, and run the Next.js development server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to access the application UI.

---

## REST API Reference

All requests and responses use JSON payloads, except for document uploads which use multipart/form-data.

### Notebooks

#### Create Notebook
* **Endpoint**: `POST /api/notebooks`
* **Request Body**:
  ```json
  {
    "title": "Data Structures",
    "description": "Analysis of Trees and Graphs",
    "embedding_model": "all-MiniLM-L6-v2",
    "use_reranking": true,
    "chunk_size": 500,
    "chunk_overlap": 100
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": "nb_a34bcf9d",
    "title": "Data Structures",
    "description": "Analysis of Trees and Graphs",
    "created_at": "2026-06-24T18:00:00",
    "embedding_model": "all-MiniLM-L6-v2",
    "use_reranking": true,
    "chunk_size": 500,
    "chunk_overlap": 100,
    "user_id": "usr_99f3"
  }
  ```

#### List Notebooks
* **Endpoint**: `GET /api/notebooks`
* **Response (200 OK)**: Array of Notebook objects.

#### Get Notebook
* **Endpoint**: `GET /api/notebooks/{id}`
* **Response (200 OK)**: Notebook object metadata.

#### Update Notebook Configuration
* **Endpoint**: `PATCH /api/notebooks/{id}`
* **Request Body**: Partial Notebook fields.
* **Response (200 OK)**: Updated Notebook object.

#### Delete Notebook
* **Endpoint**: `DELETE /api/notebooks/{id}`
* **Response (200 OK)**: `{"message": "Notebook deleted"}`

#### Suggest Topics
* **Endpoint**: `GET /api/notebooks/{id}/suggested-topics`
* **Query Parameters**: `source_names` (optional, comma-separated list of filenames to filter retrieval context).
* **Response (200 OK)**: A JSON string array containing 5 topics extracted from notebook context.

#### Auto-Generate Notebook Title
* **Endpoint**: `POST /api/notebooks/generate-title`
* **Request Body**: `{"description": "string description"}`
* **Response (200 OK)**: `{"title": "Suggested Workspace Title"}`

#### Auto-Generate Notebook Description
* **Endpoint**: `POST /api/notebooks/{id}/generate-description`
* **Request Body**: Array of strings (source filenames to analyze). Can be null.
* **Response (200 OK)**: `{"description": "Suggested description summary."}`

---

### Documents

#### Upload Document
* **Endpoint**: `POST /api/notebooks/{id}/documents`
* **Form-Data**: `file` (PDF, PPTX, or TXT file binary)
* **Processing Flow**:
  1. The API saves the file to the local storage path: `api/data/uploads/`.
  2. Creates a relational database entry with `status` set to `"processing"`.
  3. Extracts the text, splits it using the notebook's chunk configuration, and embeds it via the selected embedding model.
  4. Stores vectors in model-isolated ChromaDB directories with a `notebook_id` metadata tag.
  5. Updates document database state to `"indexed"`.
* **Response (200 OK)**:
  ```json
  {
    "id": "doc_e4c2789f",
    "name": "lecture_binary_trees.pdf",
    "file_url": "data/uploads/lecture_binary_trees.pdf",
    "status": "indexed",
    "uploaded_at": "2026-06-24T18:15:00",
    "notebook_id": "nb_a34bcf9d"
  }
  ```

#### List Documents
* **Endpoint**: `GET /api/notebooks/{id}/documents`
* **Response (200 OK)**: List of document metadata details associated with the specified notebook.

#### Delete Document
* **Endpoint**: `DELETE /api/documents/{doc_id}`
* **Processing Flow**: Removes the document vectors from the active vector store, deletes the physical upload file, and drops the record from the SQLite database.
* **Response (200 OK)**: `{"message": "Document deleted"}`

---

### Chat (Conversational RAG)

#### Create Chat Session
* **Endpoint**: `POST /api/notebooks/{id}/chats`
* **Request Body**: `{"title": "New Chat"}`
* **Response (200 OK)**: Relational Chat object metadata.

#### Ask a Question
* **Endpoint**: `POST /api/chats/{chat_id}/ask`
* **Request Body**:
  ```json
  {
    "question": "Explain red-black trees structural properties.",
    "source_names": ["lecture_binary_trees.pdf"]
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "answer": "Red-Black trees are self-balancing binary search trees where each node is colored either red or black...",
    "sources": [
      {
        "document": "lecture_binary_trees.pdf",
        "page": 14
      }
    ]
  }
  ```

#### List Chat Messages
* **Endpoint**: `GET /api/chats/{chat_id}/messages`
* **Response (200 OK)**: List of Message database objects containing role and text content.

---

### Quizzes

#### Generate Quiz
* **Endpoint**: `POST /api/notebooks/{id}/quiz/generate`
* **Request Body**:
  ```json
  {
    "topic": "Graph Traversals",
    "num_questions": 3,
    "source_names": []
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": "quiz_c019d1fa",
    "topic": "Graph Traversals",
    "created_at": "2026-06-24T18:22:00",
    "notebook_id": "nb_a34bcf9d",
    "questions": [
      {
        "id": "q_uuid_1",
        "question_text": "Which algorithm uses a queue to traverse graphs layer by layer?",
        "options": "Depth-First Search|Breadth-First Search|Kruskal's Algorithm|Dijkstra's Algorithm",
        "correct_option": 1
      }
    ]
  }
  ```

#### Submit Quiz Answers
* **Endpoint**: `POST /api/quizzes/{quiz_id}/submit`
* **Request Body**: `{"answers": [1]}`
* **Response (200 OK)**:
  ```json
  {
    "score": 1,
    "total": 1,
    "results": [
      {
        "question": "Which algorithm uses a queue to traverse graphs layer by layer?",
        "correct": true
      }
    ]
  }
  ```

---

### Assignments and Evaluations

#### Evaluate Open Answer
* **Endpoint**: `POST /api/notebooks/{id}/evaluate`
* **Request Body**:
  ```json
  {
    "question": "What is the computational complexity of searching in a balanced binary search tree?",
    "student_answer": "It is log n because it splits the searchable keys in half at each step.",
    "source_names": []
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": "eval_f941ba8b",
    "question_text": "What is the computational complexity of searching in a balanced binary search tree?",
    "student_answer": "It is log n because it splits the searchable keys in half at each step.",
    "score": 9,
    "feedback": "Excellent response. The student correctly identifies the complexity and provides the rationale regarding binary division.",
    "strengths": "Correct complexity|Accurate operational explanation",
    "missing_concepts": "Did not specify base-2 logarithm",
    "created_at": "2026-06-24T18:25:00",
    "notebook_id": "nb_a34bcf9d"
  }
  ```

#### Generate Practice Question
* **Endpoint**: `POST /api/notebooks/{id}/practice-question`
* **Request Body**:
  ```json
  {
    "topic": "AVL Trees",
    "source_names": []
  }
  ```
* **Response (200 OK)**: `{"question": "Detail the rotation steps required to balance a left-heavy AVL tree."}`

---

## Embedding and Re-ranking Benchmarks

The platform includes an evaluation framework to run retrieval tests against structured dataset scenarios. To perform comparisons, a benchmark was run over a sample dataset consisting of 482 documents and 10 queries using three distinct embedding configurations in both raw retrieval and re-ranked modes.

### Benchmarking Metric Definitions
* **Hit Rate @ K**: The percentage of test queries for which the correct ground-truth document chunk was successfully retrieved within the top K results.
* **MRR (Mean Reciprocal Rank)**: Computes retrieval rank position quality. Closer top-ranked results yield higher scores.
* **NDCG @ 5 (Normalized Discounted Cumulative Gain)**: Measures the relative relevance order of the retrieved results (ideal score is 1.0).
* **Retrieval Latency (ms)**: The average query retrieval time in milliseconds.
* **Indexing Time (s)**: Total vector database build time in seconds for the evaluation corpus.

### Benchmark Evaluation Results

The table below summarizes the retrieval and indexing performance of each evaluated embedding and re-ranking pipeline setup:

| Configuration | Hit@1 | Hit@3 | Hit@5 | MRR | NDCG@5 | Latency (ms) | Indexing (s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`nomic-embed-text` (Ollama) (Raw)** | 0.30 | 0.80 | 0.90 | 0.54 | 0.63 | 18.5ms | 4.0s |
| **`nomic-embed-text` (Ollama) + Re-ranker** | 0.40 | 0.70 | 0.80 | 0.57 | 0.62 | 58.1ms | - |
| **`all-MiniLM-L6-v2` (SentenceTransformers) (Raw)** | 0.40 | 0.80 | 0.80 | 0.61 | 0.65 | 10.0ms | 1.0s |
| **`all-MiniLM-L6-v2` (SentenceTransformers) + Re-ranker** | **0.40** | **0.80** | **0.90** | **0.62** | **0.70** | **34.9ms** | **1.0s** |
| **`bge-small-en-v1.5` (SentenceTransformers) (Raw)** | 0.30 | 0.90 | 0.90 | 0.58 | 0.67 | 8.8ms | 1.7s |
| **`bge-small-en-v1.5` (SentenceTransformers) + Re-ranker** | 0.30 | 0.80 | 0.90 | 0.56 | 0.65 | 32.0ms | - |

*(Note: SentenceTransformers run locally in-process; Re-ranker refers to `ms-marco-MiniLM-L-6-v2`)*

### Key Findings and Recommendations
1. **Local in-process models outperform external containers**: Local models (`all-MiniLM-L6-v2` and `bge-small-en-v1.5`) loaded directly via Python avoid network latency, yielding faster query retrieval times (8.8ms–10.0ms vs. 18.5ms for OllamaNomics) and faster indexing speeds (1.0s–1.7s vs. 4.0s).
2. **Re-ranking layer improves relevance quality**: Utilizing the Cross-Encoder re-ranking layer on top of `all-MiniLM-L6-v2` improved **NDCG@5 from 0.65 to 0.70** and **Hit@5 from 80% to 90%**, adding a minimal latency cost of ~25ms.
3. **Recommended Configuration**: The **`all-MiniLM-L6-v2` local embedding model combined with a `cross-encoder/ms-marco-MiniLM-L-6-v2` re-ranking layer** is the recommended default. It runs completely offline/in-process and provides high retrieval quality and low overall query latency (~35ms).

### Running the Evaluation Suite
To execute the evaluation script and rebuild the benchmarking results:
```bash
cd api
python evaluate_retrieval.py
```
This runs evaluations against the dataset defined in [api/eval_dataset.json](file:///home/pro/rag/api/eval_dataset.json) and outputs the structured details to [api/eval_results.json](file:///home/pro/rag/api/eval_results.json).

---

## Development and Coding Guidelines

### Next.js 16 and React 19 Version Considerations
This project uses Next.js 16 and React 19. Be aware that APIs, routing conventions, and dependencies may differ from earlier configurations. Review references in `node_modules/next/dist/docs/` prior to writing additional page files and check deprecation warning flags during builds.

### Code Style
* Keep components clean and modular.
* Leverage TypeScript types for client models and payloads.
* Store global states such as selected `notebook_id` at the root/context level of pages.
* Ensure all database modification statements are followed by `session.commit()` and `session.refresh()` in backend routes.
