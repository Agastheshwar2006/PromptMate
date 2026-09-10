import os
import shutil
from fastapi import UploadFile, HTTPException
from openai import AsyncOpenAI
from app.schemas import TranscriptionResponse
from app.config import Settings

async def transcribe_audio(file: UploadFile, settings: Settings) -> TranscriptionResponse:
    valid_extensions = {".webm", ".mp3", ".wav", ".m4a", ".ogg", ".flac"}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in valid_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format.")
    
    file.file.seek(0, os.SEEK_END)
    size_mb = file.file.tell() / (1024 * 1024)
    file.file.seek(0)
    
    if size_mb > settings.MAX_AUDIO_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum allowed is {settings.MAX_AUDIO_SIZE_MB}MB.")
    
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
        
        with open(temp_file_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
            
        text = transcript.text
        # Optional metadata could be returned by whisper based on format, mock others
        return TranscriptionResponse(text=text, language="en", duration=0.0)
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
