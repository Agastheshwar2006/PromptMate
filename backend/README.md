# 🚀 PromptMate Backend (Render Deployment)

This directory contains the standalone Node.js & Express backend for PromptMate, optimized for seamless deployment on **[Render](https://render.com/)**.

---

## 🛠️ Step-by-Step Deployment to Render

### Method 1: Web Service (Dashboard)

1. **Sign up or log in** to [Render](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing PromptMate.
4. Configure the settings:
   - **Name**: `promptmate-backend`
   - **Region**: Closest to your users (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend` *(crucial if deploying from a monorepo)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.
   - `FRONTEND_URL` *(optional)*: Your Vercel frontend URL (e.g. `https://promptmate.vercel.app`) to restrict CORS.
6. Click **Create Web Service**.
7. Once deployed, copy your Render service URL (e.g., `https://promptmate-backend.onrender.com`).
   - Your API will be reachable at `https://promptmate-backend.onrender.com/api`
   - Health check: `https://promptmate-backend.onrender.com/api/health`

---

### Method 2: Render Blueprint (`render.yaml`)

If using Render's Blueprint feature:
1. In Render, select **Blueprints**.
2. Point to this repository; Render will automatically discover `render.yaml`.
3. Fill in the secret `GEMINI_API_KEY` prompt and deploy.

---

## 💻 Local Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY
npm run dev
```

The backend starts at `http://localhost:10000` (or `PORT` from your `.env`).
