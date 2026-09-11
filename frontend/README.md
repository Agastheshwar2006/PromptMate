# ⚡ PromptMate Frontend (Vercel Deployment)

This directory contains the standalone React + Vite frontend for PromptMate, configured for fast, effortless deployment on **[Vercel](https://vercel.com/)**.

---

## 🛠️ Step-by-Step Deployment to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Sign in** to [Vercel](https://vercel.com/).
2. Click **Add New…** ➔ **Project**.
3. Import your GitHub repository containing PromptMate.
4. In the configuration screen:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click **Edit** and choose `frontend` *(crucial when deploying from a split or monorepo project)*
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Expand **Environment Variables** and add:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://promptmate-backend.onrender.com/api`)
     *(Note: If you omit `/api`, the client will automatically append it)*
6. Click **Deploy**.
7. In under a minute, your frontend will be live on a `*.vercel.app` domain!

---

### Method 2: Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel
# Follow interactive prompts:
# - Link to existing project? No
# - Project name: promptmate-frontend
# - In which directory is your code located? ./
# - Override settings? No
```

To set the backend URL via CLI:
```bash
vercel env add VITE_API_URL production
# Enter: https://your-backend.onrender.com/api
vercel --prod
```

---

## 💻 Local Development

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:10000/api if running local backend
npm run dev
```

The frontend will run at `http://localhost:3000` (or the next available port).
