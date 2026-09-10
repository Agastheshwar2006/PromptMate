# 🚀 PromptMate — AI Prompt Agent

**Transform raw ideas into optimized AI prompts with one click.**

PromptMate is a full-stack AI prompt agent that analyzes your unstructured text, classifies the use-case (coding, image generation, video generation, creative writing, etc.), and dynamically applies the optimal prompting technique — then lets you launch the result directly into Claude, ChatGPT, Gemini, or Copilot.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)

---

## ✨ Features

- **🧠 Agentic Intent Analysis** — Automatically classifies your input into 6 categories using LLM-powered analysis
- **📝 Smart Prompt Generation** — Applies Chain-of-Thought, Few-Shot, Persona, Structured, or Zero-Shot techniques based on the detected intent
- **🎤 Voice Input** — Speak your ideas using browser-native Web Speech API (real-time) or upload audio files (OpenAI Whisper)
- **🚀 Quick Launch Buttons** — One-click redirect to Claude, ChatGPT, Gemini, or Copilot with your prompt pre-filled
- **📚 Prompt Library** — 6 pre-built templates auto-seeded on startup, plus user-saved favorites
- **📜 Generation History** — Full history of past generations with recall and delete
- **🌙 Dark Theme UI** — Polished, modern dark-themed React interface

---

## 🏗️ Architecture

```
User Input (text/voice)
    │
    ▼
┌─────────────────────────────┐
│  FastAPI Backend             │
│  ┌────────────────────────┐ │
│  │ 1. Intent Analyzer     │──── OpenAI GPT (classify)
│  │ 2. Context Assembler   │──── SQLite (fetch template)
│  │ 3. Prompt Generator    │──── OpenAI GPT (generate)
│  │ 4. Save to History     │──── SQLite (persist)
│  └────────────────────────┘ │
└─────────────────────────────┘
    │
    ▼
React Frontend
    │
    ▼
Quick Launch → Claude / ChatGPT / Gemini / Copilot
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key (add to [backend/.env](file:///c:/Users/Agastheshwar/Downloads/Promptmate-main/Promptmate-main/backend/.env))

---

### Option 1: Run Both Together (Recommended)

From the project root:

```bash
# Using Python (unified terminal with live logs):
python run.py

# OR using npm:
npm run dev

# OR on Windows (opens backend and frontend in separate CMD windows):
.\start.bat
```

> **Note:** `run.py` automatically detects dependencies, creates your `.env` if missing, starts both servers concurrently, and cleanly stops both when you press `Ctrl+C`.

---

### Option 2: Run Separately in 2 Terminals

#### Terminal 1 — Backend:
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Project Structure

```
promptmate/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models.py            # ORM models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── seed_data.py         # Default templates
│   │   ├── routers/
│   │   │   ├── prompts.py       # POST /api/prompts/generate
│   │   │   ├── templates.py     # Template CRUD
│   │   │   ├── history.py       # History & saved prompts
│   │   │   └── speech.py        # Audio transcription
│   │   └── services/
│   │       ├── intent_analyzer.py
│   │       ├── context_assembler.py
│   │       ├── prompt_generator.py
│   │       ├── agent_pipeline.py
│   │       └── speech_transcriber.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/promptmate.js
    │   ├── hooks/useSpeechRecognition.js
    │   ├── components/
    │   │   ├── PromptInput.jsx
    │   │   ├── VoiceInput.jsx
    │   │   ├── PromptOutput.jsx
    │   │   ├── TalkingButtons.jsx
    │   │   ├── HistoryPanel.jsx
    │   │   └── TemplateSelector.jsx
    │   └── pages/Home.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/prompts/generate` | Generate an optimized prompt |
| `GET` | `/api/prompts/{id}` | Get a specific generation |
| `GET` | `/api/templates` | List all templates |
| `POST` | `/api/templates` | Create a new template |
| `GET` | `/api/history` | List generation history |
| `DELETE` | `/api/history/{id}` | Delete a history entry |
| `POST` | `/api/history/{id}/save` | Save a generation |
| `GET` | `/api/saved` | List saved prompts |
| `POST` | `/api/speech/transcribe` | Transcribe audio file |
| `POST` | `/api/speech/transcribe-and-generate` | Transcribe + generate in one call |

---

## 🎯 Supported Categories & Techniques

| Category | Technique | Use Case |
|----------|-----------|----------|
| Coding | Chain-of-Thought | Step-by-step code generation |
| Image Generation | Structured | Detailed image prompts with style/lighting |
| Video Generation | Structured | Scene, motion, camera descriptions |
| Creative Writing | Persona | Role-based storytelling |
| Data Analysis | Few-Shot | Example-driven insight extraction |
| General | Zero-Shot | Universal prompt optimization |

---

## 📄 License

MIT
