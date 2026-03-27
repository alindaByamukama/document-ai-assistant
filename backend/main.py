from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pathlib import Path
from typing import Optional
import json
from dotenv import load_dotenv

# LangChain document loaders
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader

# Import LLM handler
from .llm_handler import LLMHandler

load_dotenv()

app = FastAPI(
    title="Document AI Assistant",
    description="Upload documents, extract text, and get AI summaries"
)

# CORS: Allow frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM
llm = LLMHandler()

# Uploads folder
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class DocumentAnalysis(BaseModel):
    """Response model for document analysis"""
    filename: str
    extracted_text: str
    summary: str
    title: str
    author: str
    main_topics: list[str]


@app.get("/health")
async def health_check():
    """Health check - used by deployment to verify backend is running"""
    return {"status": "ok", "message": "Document AI Assistant is running"}


@app.post("/process", response_model=DocumentAnalysis)
async def process_document(file: UploadFile = File(...)):
    """
    Main endpoint: Upload document → Extract text → Analyze with LLM
    
    Supported formats: PDF, DOCX, TXT
    Returns: summary, title, author, main topics
    """
    
    # Validate file type
    allowed_extensions = {".pdf", ".docx", ".txt", ".doc"}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: PDF, DOCX, TXT"
        )
    
    file_path = None
    try:
        # Save file temporarily
        file_path = UPLOAD_DIR / file.filename
        content = await file.read()
        
        if len(content) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=413, detail="File too large (max 50MB)")
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Extract text using LangChain loaders
        extracted_text = ""
        
        if file_ext == ".pdf":
            loader = PyPDFLoader(str(file_path))
            pages = loader.load()
            extracted_text = "\n".join([page.page_content for page in pages])
        
        elif file_ext in [".docx", ".doc"]:
            loader = Docx2txtLoader(str(file_path))
            docs = loader.load()
            extracted_text = "\n".join([doc.page_content for doc in docs])
        
        elif file_ext == ".txt":
            loader = TextLoader(str(file_path), encoding="utf-8")
            docs = loader.load()
            extracted_text = "\n".join([doc.page_content for doc in docs])
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Could not extract text from document")
        
        # Limit text to prevent token overload
        extracted_text = extracted_text[:5000]
        
        # Analyze with LLM
        analysis = await llm.analyze(extracted_text)
        
        return DocumentAnalysis(
            filename=file.filename,
            extracted_text=extracted_text,
            summary=analysis["summary"],
            title=analysis["title"],
            author=analysis["author"],
            main_topics=analysis["main_topics"]
        )
    
    except HTTPException:
        if file_path and file_path.exists():
            os.remove(file_path)
        raise
    except Exception as e:
        if file_path and file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)