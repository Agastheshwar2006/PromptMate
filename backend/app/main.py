from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_templates
from app.routers import prompts, templates, history, speech

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_templates(db)
    finally:
        db.close()
    yield
    # Shutdown
    pass

app = FastAPI(title="PromptMate API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prompts.router)
app.include_router(templates.router)
app.include_router(history.router)
app.include_router(speech.router)

@app.get("/")
def read_root():
    return {"name": "PromptMate API", "version": "1.0.0"}
