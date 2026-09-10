from sqlalchemy.orm import Session
from app.models import PromptTemplate

def seed_templates(db: Session):
    if db.query(PromptTemplate).count() == 0:
        templates = [
            PromptTemplate(
                category="coding",
                technique="chain_of_thought",
                name="Step-by-Step Code Generation",
                template_text="""Please write code for the following request: {user_input}
Before writing the code, break down the problem step-by-step.
1. Outline the logic.
2. Consider edge cases.
3. Write clean, modular, and well-commented code.
"""
            ),
            PromptTemplate(
                category="image_generation",
                technique="structured",
                name="Detailed Image Prompt",
                template_text="""Generate a detailed prompt for an image generator based on: {user_input}
Subject: [Describe the main subject in detail]
Style: [e.g., photorealistic, digital art, oil painting]
Composition: [e.g., close-up, wide angle, rule of thirds]
Lighting: [e.g., cinematic, golden hour, neon]
Mood: [e.g., serene, chaotic, vibrant]
"""
            ),
            PromptTemplate(
                category="video_generation",
                technique="structured",
                name="Video Scene Description",
                template_text="""Create a comprehensive prompt for video generation based on: {user_input}
Scene Setup: [Describe the environment and setting]
Action/Motion: [Describe exactly what moves and how]
Camera Work: [e.g., slow pan, zoom in, drone shot]
Lighting & Atmosphere: [Describe the visual tone and lighting]
Duration & Pacing: [Describe the speed and rhythm of the clip]
"""
            ),
            PromptTemplate(
                category="creative_writing",
                technique="persona",
                name="Persona-Driven Storytelling",
                template_text="""Act as an award-winning novelist known for rich descriptions and compelling dialogue.
Write a piece based on this premise: {user_input}
Ensure the tone matches the subject matter.
Use sensory details to bring the scene to life.
"""
            ),
            PromptTemplate(
                category="data_analysis",
                technique="few_shot",
                name="Data Insight Extractor",
                template_text="""Extract key insights from the data provided: {user_input}
Example 1: Given sales data showing a 20% drop in Q3, Insight: "Investigate Q3 marketing spend and seasonal trends."
Example 2: Given user feedback highlighting slow load times, Insight: "Prioritize frontend performance optimization."
Now analyze the provided data and list 3-5 actionable insights.
"""
            ),
            PromptTemplate(
                category="general",
                technique="zero_shot",
                name="Universal Optimizer",
                template_text="""Please fulfill the following request clearly and comprehensively: {user_input}
Ensure the response is highly structured, easy to read, and directly addresses the core need without unnecessary fluff.
"""
            )
        ]
        db.add_all(templates)
        db.commit()
