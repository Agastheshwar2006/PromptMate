from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), index=True)  # coding, image_generation, video_generation, creative_writing, general
    technique = Column(String(50))  # chain_of_thought, few_shot, persona, structured, zero_shot
    name = Column(String(100))
    template_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class GenerationHistory(Base):
    __tablename__ = "generation_history"
    id = Column(Integer, primary_key=True, index=True)
    raw_input = Column(Text)
    input_method = Column(String(10), default="text")  # text or voice
    detected_intent = Column(String(50))
    technique_used = Column(String(50))
    generated_prompt = Column(Text)
    is_saved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SavedPrompt(Base):
    __tablename__ = "saved_prompts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    prompt_text = Column(Text)
    category = Column(String(50))
    history_id = Column(Integer, ForeignKey("generation_history.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
