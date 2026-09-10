from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PromptGenerateRequest(BaseModel):
    raw_input: str
    input_method: str = "text"

class IntentResult(BaseModel):
    category: str
    sub_type: str
    confidence: float

class PromptGenerateResponse(BaseModel):
    id: int
    raw_input: str
    detected_intent: str
    technique_used: str
    generated_prompt: str
    created_at: datetime

class TemplateResponse(BaseModel):
    id: int
    category: str
    technique: str
    name: str
    template_text: str

class TemplateCreateRequest(BaseModel):
    category: str
    technique: str
    name: str
    template_text: str

class HistoryResponse(BaseModel):
    id: int
    raw_input: str
    input_method: str
    detected_intent: str
    technique_used: str
    generated_prompt: str
    is_saved: bool
    created_at: datetime

class SavePromptRequest(BaseModel):
    title: str
    prompt_text: str
    category: str
    history_id: Optional[int] = None

class SavedPromptResponse(BaseModel):
    id: int
    title: str
    prompt_text: str
    category: str
    history_id: Optional[int]
    created_at: datetime

class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: Optional[float] = None
