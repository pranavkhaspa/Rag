from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import create_db_and_tables
from app.api import notebook, document, chat, quiz, assignment

app = FastAPI(title="Notebook-based Learning Platform API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(notebook.router, prefix="/api/notebooks", tags=["Notebooks"])
app.include_router(document.router, prefix="/api", tags=["Documents"])
app.include_router(chat.router, prefix="/api", tags=["Chats"])
app.include_router(quiz.router, prefix="/api", tags=["Quizzes"])
app.include_router(assignment.router, prefix="/api", tags=["Assignments"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Notebook-based Learning Platform API"}
