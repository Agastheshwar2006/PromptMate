from sqlalchemy.orm import Session
from app.config import Settings
from app.schemas import PromptGenerateResponse
from app.models import GenerationHistory
from app.services.intent_analyzer import analyze_intent
from app.services.context_assembler import assemble_context
from app.services.prompt_generator import generate_prompt

async def run_pipeline(raw_input: str, input_method: str, db: Session, settings: Settings) -> PromptGenerateResponse:
    intent = await analyze_intent(raw_input, settings)
    context = await assemble_context(intent, raw_input, db)
    final_prompt = await generate_prompt(context, settings)
    
    history_entry = GenerationHistory(
        raw_input=raw_input,
        input_method=input_method,
        detected_intent=intent.category,
        technique_used=context["technique"],
        generated_prompt=final_prompt
    )
    
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)
    
    return PromptGenerateResponse(
        id=history_entry.id,
        raw_input=history_entry.raw_input,
        detected_intent=history_entry.detected_intent,
        technique_used=history_entry.technique_used,
        generated_prompt=history_entry.generated_prompt,
        created_at=history_entry.created_at
    )
