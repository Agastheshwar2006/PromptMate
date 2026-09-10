import json
import os
import re
from app.schemas import IntentResult
from app.config import Settings

async def analyze_intent(raw_input: str, settings: Settings) -> IntentResult:
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    
    system_prompt = """
    You are an intent analyzer for a prompt generation tool.
    Analyze the user's input and classify it into one of these categories:
    - coding
    - image_generation
    - video_generation
    - creative_writing
    - data_analysis
    - general

    Also provide a specific sub_type (e.g., python_script, portrait_photo) and a confidence score between 0.0 and 1.0.
    You MUST respond with ONLY a valid JSON object matching this schema:
    {
      "category": "string",
      "sub_type": "string",
      "confidence": 0.0
    }
    """

    # Primary: Use Gemini
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model_name = settings.GEMINI_MODEL
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            response = await model.generate_content_async(raw_input)
            text = response.text.strip()
            data = json.loads(text)
            return IntentResult(**data)
        except Exception as e:
            print(f"[WARN] Gemini intent analysis fallback: {e}")

    # Secondary: Use OpenAI if configured
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": raw_input}
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            return IntentResult(**data)
        except Exception as e:
            print(f"[WARN] OpenAI intent analysis fallback: {e}")

    # Final intelligent heuristic fallback
    lower = raw_input.lower()
    if any(k in lower for k in ["code", "script", "python", "javascript", "function", "bug", "api", "html", "css", "sql"]):
        return IntentResult(category="coding", sub_type="programming", confidence=0.85)
    if any(k in lower for k in ["image", "photo", "picture", "draw", "painting", "illustration", "render"]):
        return IntentResult(category="image_generation", sub_type="image_render", confidence=0.85)
    if any(k in lower for k in ["video", "clip", "animation", "motion", "cinematic"]):
        return IntentResult(category="video_generation", sub_type="video_clip", confidence=0.85)
    if any(k in lower for k in ["story", "poem", "essay", "novel", "write", "dialogue", "scriptwriter"]):
        return IntentResult(category="creative_writing", sub_type="creative_narrative", confidence=0.85)
    if any(k in lower for k in ["data", "csv", "chart", "analyze", "metrics", "statistics", "dataset"]):
        return IntentResult(category="data_analysis", sub_type="data_insights", confidence=0.85)

    return IntentResult(category="general", sub_type="universal", confidence=0.7)
