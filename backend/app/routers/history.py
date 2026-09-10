from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import GenerationHistory, SavedPrompt
from app.schemas import HistoryResponse, SavePromptRequest, SavedPromptResponse

router = APIRouter(tags=["history"])

@router.get("/api/history", response_model=List[HistoryResponse])
def list_history(db: Session = Depends(get_db)):
    return db.query(GenerationHistory).order_by(GenerationHistory.created_at.desc()).limit(50).all()

@router.delete("/api/history/{id}")
def delete_history(id: int, db: Session = Depends(get_db)):
    history = db.query(GenerationHistory).filter(GenerationHistory.id == id).first()
    if not history:
        raise HTTPException(status_code=404, detail="History not found")
    db.delete(history)
    db.commit()
    return {"status": "success"}

@router.post("/api/history/{id}/save", response_model=SavedPromptResponse)
def save_history(id: int, request: SavePromptRequest, db: Session = Depends(get_db)):
    history = db.query(GenerationHistory).filter(GenerationHistory.id == id).first()
    if not history:
        raise HTTPException(status_code=404, detail="History not found")
    
    saved = SavedPrompt(
        title=request.title,
        prompt_text=request.prompt_text,
        category=request.category,
        history_id=id
    )
    db.add(saved)
    history.is_saved = True
    db.commit()
    db.refresh(saved)
    return saved

@router.get("/api/saved", response_model=List[SavedPromptResponse])
def list_saved(db: Session = Depends(get_db)):
    return db.query(SavedPrompt).order_by(SavedPrompt.created_at.desc()).all()

@router.delete("/api/saved/{id}")
def delete_saved(id: int, db: Session = Depends(get_db)):
    saved = db.query(SavedPrompt).filter(SavedPrompt.id == id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved prompt not found")
    
    if saved.history_id:
        history = db.query(GenerationHistory).filter(GenerationHistory.id == saved.history_id).first()
        if history:
            history.is_saved = False
            
    db.delete(saved)
    db.commit()
    return {"status": "success"}
