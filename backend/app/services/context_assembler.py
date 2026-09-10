from sqlalchemy.orm import Session
from app.schemas import IntentResult
from app.models import PromptTemplate

async def assemble_context(intent: IntentResult, raw_input: str, db: Session) -> dict:
    template = db.query(PromptTemplate).filter(PromptTemplate.category == intent.category).first()
    
    if not template:
        template = db.query(PromptTemplate).filter(PromptTemplate.category == "general").first()
        
    template_text = template.template_text if template else "Expand on this idea: {user_input}"
    technique = template.technique if template else "zero_shot"
    category = template.category if template else "general"

    instructions = (
        f"You are an expert prompt engineer. Your goal is to transform the user's input into an optimized prompt "
        f"using the provided template. The detected intent category is '{intent.category}' and the sub-type is '{intent.sub_type}'. "
        f"Please use the '{technique}' prompting technique as outlined in the template."
    )

    return {
        "template_text": template_text,
        "technique": technique,
        "category": category,
        "raw_input": raw_input,
        "instructions": instructions
    }
