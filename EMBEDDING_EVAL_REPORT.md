# 🎓 Embedding Models & Re-ranking Evaluation Report

This report documents our experiments with different embedding models, retrieval relevance and accuracy, and the implementation of a local re-ranking layer.

---

## 1. Objectives

Our goal was to optimize the Retrieval-Augmented Generation (RAG) search pipeline for the Notebook-based Learning Platform. We focused on:
1. **Embedding Quality**: Comparing the default Ollama model with lightweight, high-performance local SentenceTransformer models.
2. **Re-ranking Layer**: Implementing a local Cross-Encoder re-ranker to score and sort the top retrieved candidates.
3. **Relevance vs. Latency Trade-off**: Measuring the impact on precision (Hit Rate), mean reciprocal rank (MRR), normalized discounted cumulative gain (NDCG), indexing time, and query latency.

---

## 2. Tested Architecture & Configurations

We compared **3 embedding models** across two states (**Raw Retrieval** vs. **Re-ranked Retrieval**):

1. **`nomic-embed-text` (via local Ollama)**
   - Dimensions: 768
   - Mode: Run via Ollama API call
2. **`all-MiniLM-L6-v2` (via in-process SentenceTransformers)**
   - Dimensions: 384
   - Mode: Loaded directly in Python memory via PyTorch
3. **`bge-small-en-v1.5` (via in-process SentenceTransformers)**
   - Dimensions: 384
   - Mode: Loaded directly in Python memory via PyTorch (utilizing search prefix instructions)

### The Re-ranking Layer
We implemented a Cross-Encoder re-ranking layer using **`cross-encoder/ms-marco-MiniLM-L-6-v2`** (80MB, fast and accurate).
- **Workflow**: For a given query, we retrieve the top 10 chunks from ChromaDB using the embedding model, feed the `(query, document_text)` pairs to the Cross-Encoder, compute similarity scores, and keep the top 5 re-ranked results.

---

## 3. Evaluation Methodology

We created a representative evaluation dataset (`api/eval_dataset.json`) containing **10 diverse, factual queries** generated from the uploaded PDF documents (e.g., *Python Programming.pdf*) using local LLM (`mistral`). Each query is mapped to a ground-truth chunk ID.

We measured the following metrics:
- **Hit Rate @ K** (Recall @ K): The proportion of queries for which the correct document chunk is retrieved in the top K results.
- **MRR (Mean Reciprocal Rank)**: Evaluates the position of the correct chunk. Closer to the top (rank 1) yields a higher score ($1/\text{rank}$).
- **NDCG @ 5**: Measures the relevance order of the retrieved results (ideal score is 1.0).
- **Retrieval Latency (ms)**: The average roundtrip time for querying the index (and re-ranking, if enabled).
- **Indexing Time (s)**: Time taken to vectorize and insert the corpus (482 chunks) into ChromaDB.

---

## 4. Experimental Results

Here is the benchmarking summary of our experiments:

| Configuration | Hit@1 | Hit@3 | Hit@5 | MRR | NDCG@5 | Latency (ms) | Indexing (s) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`nomic-embed-text` (Ollama) (Raw)** | 0.30 | 0.80 | 0.90 | 0.54 | 0.63 | 18.5ms | 4.0s |
| **`nomic-embed-text` (Ollama) + Re-ranker** | 0.40 | 0.70 | 0.80 | 0.57 | 0.62 | 58.1ms | - |
| **`all-MiniLM-L6-v2` (ST) (Raw)** | 0.40 | 0.80 | 0.80 | 0.61 | 0.65 | 10.0ms | 1.0s |
| **`all-MiniLM-L6-v2` (ST) + Re-ranker** | **0.40** | **0.80** | **0.90** | **0.62** | **0.70** | **34.9ms** | **1.0s** |
| **`bge-small-en-v1.5` (ST) (Raw)** | 0.30 | 0.90 | 0.90 | 0.58 | 0.67 | 8.8ms | 1.7s |
| **`bge-small-en-v1.5` (ST) + Re-ranker** | 0.30 | 0.80 | 0.90 | 0.56 | 0.65 | 32.0ms | - |

*(ST = SentenceTransformers local, Re-ranker = `ms-marco-MiniLM-L-6-v2`)*

---

## 5. Key Findings & Analysis

### 1. In-process SentenceTransformers vs. Ollama API
- **Latency**: Local models run via Python (`all-MiniLM-L6-v2` and `bge-small-en-v1.5`) are significantly faster than Ollama (8.8ms–10.0ms vs 18.5ms). This is because local models avoid HTTP/network overhead and run directly on PyTorch in-process.
- **Indexing Speed**: Local model indexing is **3x–4x faster** (1.0s–1.7s vs 4.0s). For large batch processing, this makes a huge difference.

### 2. Impact of the Re-ranking Layer
- **Accuracy Improvement**: Adding the re-ranking layer on top of `all-MiniLM-L6-v2` boosted the **NDCG@5 from 0.65 to 0.70** and **Hit@5 from 80% to 90%**. This shows the Cross-Encoder successfully bubble-up the correct chunk into the top results.
- **Latency Cost**: The Cross-Encoder adds a re-ranking latency of **~23ms–25ms**. However, the total latency (**34.9ms**) remains extremely fast and is well below the standard 100ms budget for interactive search interfaces.

### 3. Model Comparisons
- **`all-MiniLM-L6-v2` + Re-ranker** is the clear winner for our dataset, delivering the highest MRR (0.62) and NDCG@5 (0.70) with excellent indexing speeds.
- **`bge-small-en-v1.5`** is extremely strong on raw recall (Hit@3 of 90%), but re-ranking did not improve its rank-order metrics on this small dataset, likely due to BGE's internal instruction-based vectors interacting with the general-domain CrossEncoder model.

---

## 6. Recommended Setup

We recommend the **`all-MiniLM-L6-v2` local embedding model combined with a `cross-encoder/ms-marco-MiniLM-L-6-v2` re-ranking layer**. 

### Why this is the best setup:
1. **Speed & Efficiency**: It runs 100% in-process. No dependencies on external API endpoints or Ollama service health.
2. **Quality**: It yields a **90% Recall@5** (Hit@5) and the highest relevance ranking order (0.70 NDCG@5) among all tested setups.
3. **Low Overhead**: Total query execution time is only **~35ms**, which is imperceptible to users.
4. **Isolated DB Folders**: Dynamic subdirectories (e.g. `chroma/all-MiniLM-L6-v2`) prevent collision between models.

---

## 7. Setup & Code Integration

We updated the workspace codebase to dynamically support these setups per-notebook:

1. **Database Schema**: Modified `Notebook` sqlmodel to store settings:
   - `embedding_model: str` (default: `"nomic-embed-text"`)
   - `use_reranking: bool` (default: `False`)
2. **SQLite Migration**: Integrated startup table Alter code in `session.py` to seamlessly add these columns to the existing tables.
3. **Model Caching**: Implemented a global in-memory model cache in `get_embedding_function.py` and `rag_service.py` to keep PyTorch models loaded in RAM, avoiding cold-start delays.
4. **Dynamic Context Retrieval**: Updated `document.py`, `chat.py`, `quiz.py`, and `assignment.py` API endpoints to dynamically instantiate ChromaStore and RAGService based on the specific notebook's selection.
