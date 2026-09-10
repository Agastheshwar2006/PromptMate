import os
from app.config import Settings

async def generate_prompt(context: dict, settings: Settings) -> str:
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    
    system_prompt = f"""
    {context['instructions']}
    
    Here is a quick guide on prompting techniques:
    - chain_of_thought: Guide the AI to think step by step before answering.
    - few_shot: Provide examples within the prompt.
    - persona: Assign a role or persona to the AI.
    - structured: Use markdown, sections, and clear constraints.
    - zero_shot: Direct instruction without examples.
    
    Template to use:
    {context['template_text']}
    
    Replace {{user_input}} in the template with the essence of the user's request and add any necessary details to make it a high-quality, production-ready prompt.
    Return ONLY the final generated prompt string, without quotes or additional commentary.
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
            )
            response = await model.generate_content_async(context["raw_input"])
            return response.text.strip()
        except Exception as e:
            print(f"[WARN] Gemini generation failed, checking alternatives: {e}")

    # Secondary: Use OpenAI if available
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": context["raw_input"]}
                ]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[WARN] OpenAI generation failed: {e}")

    # Fallback to smart template substitution if no API key is working
    template_str = context.get('template_text', '{user_input}')
    return template_str.replace("{user_input}", context.get("raw_input", "")).strip()
