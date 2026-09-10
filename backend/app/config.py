from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Gemini Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    DATABASE_URL: str = "sqlite:///./promptmate.db"
    MAX_AUDIO_SIZE_MB: int = 25

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
