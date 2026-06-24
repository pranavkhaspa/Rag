import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const notebookApi = {
  list: () => api.get('/notebooks'),
  create: (data: { title: string; description?: string; embedding_model?: string; use_reranking?: boolean; chunk_size?: number; chunk_overlap?: number }) => api.post('/notebooks', data),
  update: (id: string, data: { title?: string; description?: string; embedding_model?: string; use_reranking?: boolean; chunk_size?: number; chunk_overlap?: number }) => api.patch(`/notebooks/${id}`, data),
  get: (id: string) => api.get(`/notebooks/${id}`),
  delete: (id: string) => api.delete(`/notebooks/${id}`),
  listDocuments: (id: string) => api.get(`/notebooks/${id}/documents`),
  getSuggestedTopics: (id: string, sourceNames?: string[]) => 
    api.get(`/notebooks/${id}/suggested-topics`, { 
      params: { source_names: sourceNames?.join(',') } 
    }),
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/notebooks/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteDocument: (docId: string) => api.delete(`/documents/${docId}`),
  generateTitle: (description: string) => api.post('/notebooks/generate-title', { description }),
  generateDescription: (id: string, sourceNames?: string[]) => 
    api.post(`/notebooks/${id}/generate-description`, sourceNames),
};

export const chatApi = {
  create: (notebookId: string, title: string) => api.post(`/notebooks/${notebookId}/chats`, { title }),
  ask: (chatId: string, question: string, sourceNames?: string[]) => 
    api.post(`/chats/${chatId}/ask`, { question, source_names: sourceNames }),
  getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
};

export const quizApi = {
  list: (notebookId: string) => api.get(`/notebooks/${notebookId}/quizzes`),
  generate: (notebookId: string, topic: string, numQuestions: number, sourceNames?: string[]) => 
    api.post(`/notebooks/${notebookId}/quiz/generate`, { topic, num_questions: numQuestions, source_names: sourceNames }),
  submit: (quizId: string, answers: number[]) => 
    api.post(`/quizzes/${quizId}/submit`, { answers }),
};

export const evalApi = {
  list: (notebookId: string) => api.get(`/notebooks/${notebookId}/evaluations`),
  evaluate: (notebookId: string, question: string, studentAnswer: string, sourceNames?: string[]) => 
    api.post(`/notebooks/${notebookId}/evaluate`, { question, student_answer: studentAnswer, source_names: sourceNames }),
  getPracticeQuestion: (notebookId: string, topic?: string, sourceNames?: string[]) =>
    api.post(`/notebooks/${notebookId}/practice-question`, { topic, source_names: sourceNames }),
};

export default api;
