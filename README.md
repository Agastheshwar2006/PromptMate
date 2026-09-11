# 🚀 PromptMate — AI Prompt Agent

**Transform raw ideas into optimized AI prompts with one click.**

PromptMate is a full-stack AI prompt agent that analyzes your unstructured text, classifies the use-case (coding, image generation, video generation, creative writing, data analysis, etc.), dynamically applies the optimal prompting technique (Chain-of-Thought, Structured, Persona, Few-Shot, Zero-Shot), and lets you launch directly into Claude, ChatGPT, Gemini, or Copilot.

---

## 📁 Repository Structure (Backend & Frontend Split)

This repository is divided into clean, decoupled directories optimized for separate deployment on **Render** (Backend API) and **Vercel** (Frontend React App), while also supporting unified full-stack execution:

```
promptmate/
├── backend/                  # 🖥️ Standalone Node.js & Express API (Deploy on Render)
│   ├── server.ts             # Express server with Gemini prompt synthesis & audio routes
│   ├── package.json          # Backend-only dependencies & build scripts
│   ├── render.yaml           # Render blueprint specification
│   ├── .env.example          # GEMINI_API_KEY, PORT, FRONTEND_URL
│   └── README.md             # Detailed Render deployment instructions
│
├── frontend/                 # ⚡ Standalone React + Vite SPA (Deploy on Vercel)
│   ├── src/                  # React components, UI pages, and API client
│   │   ├── api/promptmate.js # Dynamic API client (supports VITE_API_URL & client fallbacks)
│   │   ├── components/       # PromptInput, PromptOutput, HistoryPanel, VoiceInput, etc.
│   │   └── pages/Home.jsx    # Main application dashboard
│   ├── package.json          # Frontend-only dependencies
│   ├── vite.config.ts        # Vite configuration with lucide-react optimization
│   ├── vercel.json           # Vercel SPA routing & cache headers
│   ├── .env.example          # VITE_API_URL=https://your-backend.onrender.com/api
│   └── README.md             # Detailed Vercel deployment instructions
│
├── render.yaml               # Root Render blueprint (points to backend directory)
├── vercel.json               # Root Vercel configuration
├── server.ts                 # Full-stack orchestrator for local preview & containers
└── package.json              # Unified scripts (dev, build, start, build:backend, build:frontend)
```

---

## 🌐 Deploying to Render (Backend)

1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `promptmate-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. In **Environment Variables**:
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com).
   - `FRONTEND_URL` *(optional)*: Your Vercel frontend URL (e.g., `https://promptmate-frontend.vercel.app`).
5. Click **Create Web Service**.
6. Copy your service URL when active: `https://promptmate-backend.onrender.com`.

---

## ⚡ Deploying to Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com/) and click **Add New…** ➔ **Project**.
2. Import this repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://promptmate-backend.onrender.com/api` (replace with your actual Render URL).
5. Click **Deploy**.
6. Your app is live!

---

## 💻 Local Development

### Option 1: Run Full-Stack Unified (Recommended)
From the project root:
```bash
npm install
npm run dev
```
Runs the full application on `http://localhost:3000` with hot reload and API endpoints.

### Option 2: Run Separately in 2 Terminals

#### Terminal 1 — Backend:
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:10000 (or PORT in backend/.env)
```

#### Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000, proxying /api to the backend
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Service status and uptime check |
| `POST` | `/api/prompts/generate` | Generate and optimize prompt using AI |
| `GET`  | `/api/prompts/:id` | Fetch specific prompt generation |
| `GET`  | `/api/history` | List prompt generation history |
| `DELETE`| `/api/history/:id` | Delete history entry |
| `POST` | `/api/history/:id/save` | Save prompt to favorites |
| `GET`  | `/api/saved` | List saved favorite prompts |
| `DELETE`| `/api/saved/:id` | Delete saved prompt |
| `GET`  | `/api/templates` | Retrieve prompt templates |
| `POST` | `/api/templates` | Create custom template |
| `POST` | `/api/speech/transcribe` | Transcribe voice recording via Gemini |
| `POST` | `/api/speech/transcribe-and-generate` | Transcribe and generate prompt in single step |
| `GET`  | `/api/stats` | Fast count metrics for UI badges |

---

## 📄 License

MIT
