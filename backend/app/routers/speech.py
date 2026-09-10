from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.schemas import TranscriptionResponse, PromptGenerateResponse
from app.services.speech_transcriber import transcribe_audio
from app.services.agent_pipeline import run_pipeline

router = APIRouter(prefix="/api/speech", tags=["speech"])

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)):
    return await transcribe_audio(file, settings)

@router.post("/transcribe-and-generate", response_model=PromptGenerateResponse)
async def transcribe_and_generate(file: UploadFile = File(...), db: Session = Depends(get_db)):
    transcription = await transcribe_audio(file, settings)
    return await run_pipeline(transcription.text, "voice", db, settings)
