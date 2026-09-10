from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas import PromptGenerateRequest, PromptGenerateResponse
from app.models import GenerationHistory
from app.services.agent_pipeline import run_pipeline

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

@router.post("/generate", response_model=PromptGenerateResponse)
async def generate(request: PromptGenerateRequest, db: Session = Depends(get_db)):
    return await run_pipeline(request.raw_input, request.input_method, db, settings)

@router.get("/{id}", response_model=PromptGenerateResponse)
def get_prompt(id: int, db: Session = Depends(get_db)):
    history = db.query(GenerationHistory).filter(GenerationHistory.id == id).first()
    if not history:
        raise HTTPException(status_code=404, detail="Prompt generation history not found")
    return PromptGenerateResponse(
        id=history.id,
        raw_input=history.raw_input,
        detected_intent=history.detected_intent,
        technique_used=history.technique_used,
        generated_prompt=history.generated_prompt,
        created_at=history.created_at
    )
