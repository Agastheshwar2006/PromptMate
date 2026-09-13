import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

interface PromptTemplate {
  id: number;
  category: string;
  technique: string;
  name: string;
  template_text: string;
  created_at: string;
}

interface GenerationHistory {
  id: number;
  raw_input: string;
  input_method: string;
  detected_intent: string;
  technique_used: string;
  generated_prompt: string;
  is_saved: boolean;
  created_at: string;
}

interface SavedPrompt {
  id: number;
  title: string;
  prompt_text: string;
  category: string;
  history_id: number | null;
  created_at: string;
}

// In-memory data store
let templateIdCounter = 1;
const promptTemplates: PromptTemplate[] = [
  {
    id: templateIdCounter++,
    category: "coding",
    technique: "chain_of_thought",
    name: "Step-by-Step Code Generation",
    template_text: `Please write code for the following request: {user_input}
Before writing the code, break down the problem step-by-step.
1. Outline the logic.
2. Consider edge cases.
3. Write clean, modular, and well-commented code.`,
    created_at: new Date().toISOString(),
  },
  {
    id: templateIdCounter++,
    category: "image_generation",
    technique: "structured",
    name: "Detailed Image Prompt",
    template_text: `Generate a detailed prompt for an image generator based on: {user_input}
Subject: [Describe the main subject in detail]
Style: [e.g., photorealistic, digital art, oil painting]
Composition: [e.g., close-up, wide angle, rule of thirds]
Lighting: [e.g., cinematic, golden hour, neon]
Mood: [e.g., serene, chaotic, vibrant]`,
    created_at: new Date().toISOString(),
  },
  {
    id: templateIdCounter++,
    category: "video_generation",
    technique: "structured",
    name: "Video Scene Description",
    template_text: `Create a comprehensive prompt for video generation based on: {user_input}
Scene Setup: [Describe the environment and setting]
Action/Motion: [Describe exactly what moves and how]
Camera Work: [e.g., slow pan, zoom in, drone shot]
Lighting & Atmosphere: [Describe the visual tone and lighting]
Duration & Pacing: [Describe the speed and rhythm of the clip]`,
    created_at: new Date().toISOString(),
  },
  {
    id: templateIdCounter++,
    category: "creative_writing",
    technique: "persona",
    name: "Persona-Driven Storytelling",
    template_text: `Act as an award-winning novelist known for rich descriptions and compelling dialogue.
Write a piece based on this premise: {user_input}
Ensure the tone matches the subject matter.
Use sensory details to bring the scene to life.`,
    created_at: new Date().toISOString(),
  },
  {
    id: templateIdCounter++,
    category: "data_analysis",
    technique: "few_shot",
    name: "Data Insight Extractor",
    template_text: `Extract key insights from the data provided: {user_input}
Example 1: Given sales data showing a 20% drop in Q3, Insight: "Investigate Q3 marketing spend and seasonal trends."
Example 2: Given user feedback highlighting slow load times, Insight: "Prioritize frontend performance optimization."
Now analyze the provided data and list 3-5 actionable insights.`,
    created_at: new Date().toISOString(),
  },
  {
    id: templateIdCounter++,
    category: "general",
    technique: "zero_shot",
    name: "Universal Optimizer",
    template_text: `Please fulfill the following request clearly and comprehensively: {user_input}
Ensure the response is highly structured, easy to read, and directly addresses the core need without unnecessary fluff.`,
    created_at: new Date().toISOString(),
  },
];

let historyIdCounter = 1;
const generationHistory: GenerationHistory[] = [];

let savedIdCounter = 1;
const savedPrompts: SavedPrompt[] = [];

// Gemini Client Lazy Init
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

const DEPRECATED_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-2.0-flash-thinking",
  "gemini-2.5-flash",
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro",
  "models/gemini-pro",
  "models/gemini-2.0-flash",
  "models/gemini-2.0-pro",
  "models/gemini-2.0-flash-thinking",
  "models/gemini-2.5-flash",
]);

function getEffectiveModel(): string {
  const envModel = (process.env.GEMINI_MODEL || "").trim();
  if (envModel && !DEPRECATED_MODELS.has(envModel.toLowerCase())) {
    return envModel;
  }
  return "gemini-3.1-flash-lite";
}

// Cooldown tracker for rate-limited / quota-exhausted models
const modelCooldowns = new Map<string, number>();

function isModelCoolingDown(model: string): boolean {
  const until = modelCooldowns.get(model);
  if (!until) return false;
  if (Date.now() > until) {
    modelCooldowns.delete(model);
    return false;
  }
  return true;
}

function markModelCooldown(model: string, err?: any) {
  let cooldownMs = 60_000;
  try {
    const errMsg = typeof err === "string" ? err : (err?.message || JSON.stringify(err || ""));
    const match = errMsg.match(/retry(?:Delay)?["':\s]+([0-9.]+)/i);
    if (match && match[1]) {
      cooldownMs = Math.max(15_000, Math.ceil(parseFloat(match[1]) * 1000) + 3000);
    }
  } catch {}
  modelCooldowns.set(model, Date.now() + cooldownMs);
}

function getOrderedCandidateModels(preferred: string[]): string[] {
  const unique = [...new Set(preferred.filter(m => !DEPRECATED_MODELS.has(m.toLowerCase()) && m !== "gemini-3.6-flash"))];
  const active = unique.filter(m => !isModelCoolingDown(m));
  const cooling = unique.filter(m => isModelCoolingDown(m));
  return [...active, ...cooling];
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: string,
  config?: any
) {
  const preferred = [
    getEffectiveModel(),
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
  ];
  const uniqueModels = getOrderedCandidateModels(preferred);

  let lastError: any = null;
  for (const model of uniqueModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || String(err)).toLowerCase();
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("resource_exhausted") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("quota");

        const isUnsupported =
          errMsg.includes("404") ||
          errMsg.includes("not found") ||
          errMsg.includes("not supported");

        if (isTransient) {
          markModelCooldown(model, err);
          console.info(`Model ${model} rate-limited or quota exceeded, switching to fallback candidate...`);
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }
          break;
        }

        if (isUnsupported) {
          break;
        }

        break;
      }
    }
  }
  throw lastError;
}

// Fast heuristic intent categorization and technique assignment
function getHeuristicIntent(rawInput: string, explicitCategory?: string): { category: string; technique: string } {
  if (explicitCategory && explicitCategory !== "all") {
    const matched = promptTemplates.find((t) => t.category === explicitCategory);
    if (matched) return { category: matched.category, technique: matched.technique };
  }

  const lower = rawInput.toLowerCase();
  if (["code", "script", "python", "javascript", "function", "bug", "api", "html", "css", "sql", "react", "typescript", "c++", "rust", "database", "algorithm"].some(k => lower.includes(k))) {
    return { category: "coding", technique: "chain_of_thought" };
  }
  if (["image", "photo", "picture", "draw", "painting", "illustration", "render", "photorealistic", "portrait", "scenery", "wallpaper"].some(k => lower.includes(k))) {
    return { category: "image_generation", technique: "structured" };
  }
  if (["video", "clip", "animation", "motion", "cinematic", "footage", "filmmaker", "drone shot"].some(k => lower.includes(k))) {
    return { category: "video_generation", technique: "structured" };
  }
  if (["story", "poem", "essay", "novel", "write", "dialogue", "scriptwriter", "narrative", "fiction", "character"].some(k => lower.includes(k))) {
    return { category: "creative_writing", technique: "persona" };
  }
  if (["data", "csv", "chart", "analyze", "metrics", "statistics", "dataset", "insights", "financial", "analytics", "churn"].some(k => lower.includes(k))) {
    return { category: "data_analysis", technique: "few_shot" };
  }

  return { category: "general", technique: "zero_shot" };
}

// In-memory cache for fast repeat prompt enhancements
const promptCache = new Map<string, { detected_intent: string; technique_used: string; generated_prompt: string }>();

// Single-shot Prompt Generation Pipeline
async function runPipeline(rawInput: string, inputMethod: string = "text") {
  const trimmed = rawInput.trim();

  let explicitCategory = "";
  const catMatch = trimmed.match(/^\[Category Context:\s*([a-zA-Z0-9_-]+)\]/i);
  if (catMatch) {
    explicitCategory = catMatch[1];
  }

  const cacheKey = trimmed.toLowerCase();
  if (promptCache.has(cacheKey)) {
    const cached = promptCache.get(cacheKey)!;
    const cachedEntry: GenerationHistory = {
      id: historyIdCounter++,
      raw_input: rawInput,
      input_method: inputMethod,
      detected_intent: cached.detected_intent,
      technique_used: cached.technique_used,
      generated_prompt: cached.generated_prompt,
      is_saved: false,
      created_at: new Date().toISOString(),
    };
    generationHistory.unshift(cachedEntry);
    return {
      id: cachedEntry.id,
      raw_input: cachedEntry.raw_input,
      detected_intent: cachedEntry.detected_intent,
      technique_used: cachedEntry.technique_used,
      generated_prompt: cachedEntry.generated_prompt,
      created_at: cachedEntry.created_at,
    };
  }

  const heuristic = getHeuristicIntent(trimmed, explicitCategory);
  let detectedIntent = heuristic.category;
  let techniqueUsed = heuristic.technique;
  let generatedPrompt = "";

  const ai = getGeminiClient();
  if (ai) {
    try {
      const systemInstruction = `You are PromptMate, an elite prompt engineering agent.
Your task is to take a raw user request, understand its goal, and transform it into a world-class, optimized AI prompt.

Categories:
- coding (technique: chain_of_thought)
- image_generation (technique: structured)
- video_generation (technique: structured)
- creative_writing (technique: persona)
- data_analysis (technique: few_shot)
- general (technique: zero_shot)

Instructions:
1. Classify the user's intent into one of the 6 categories.
2. Formulate an optimized prompt that produces the highest possible quality result when run in ChatGPT, Claude, Gemini, Midjourney, or Sora.
3. Return ONLY valid JSON with keys:
   - "detected_intent": string (one of the 6 categories above)
   - "technique_used": string
   - "generated_prompt": string (the complete, fully articulated prompt)
Do not wrap in backticks or markdown fences. Output pure JSON only.`;

      const promptPayload = explicitCategory
        ? `Category hint: ${explicitCategory}\nUser input: "${trimmed}"`
        : `User input: "${trimmed}"`;

      const response = await generateWithModelFallback(ai, promptPayload, {
        systemInstruction,
        responseMimeType: "application/json",
      });

      const text = response.text?.trim() || "";
      try {
        const parsed = JSON.parse(text);
        if (parsed.generated_prompt && typeof parsed.generated_prompt === "string") {
          generatedPrompt = parsed.generated_prompt.trim();
          if (parsed.detected_intent) detectedIntent = parsed.detected_intent;
          if (parsed.technique_used) techniqueUsed = parsed.technique_used;
        }
      } catch {
        if (text) {
          generatedPrompt = text;
        }
      }
    } catch (llmErr) {
      console.warn("LLM generation failed, using fallback template:", llmErr);
    }
  }

  if (!generatedPrompt) {
    const template = promptTemplates.find(t => t.category === detectedIntent) || promptTemplates.find(t => t.category === "general");
    const templateText = template ? template.template_text : "Expand on this idea: {user_input}";
    generatedPrompt = templateText.replace("{user_input}", trimmed).trim();
  }

  if (promptCache.size >= 100) {
    const oldestKey = promptCache.keys().next().value;
    if (oldestKey) promptCache.delete(oldestKey);
  }
  promptCache.set(cacheKey, {
    detected_intent: detectedIntent,
    technique_used: techniqueUsed,
    generated_prompt: generatedPrompt,
  });

  const entry: GenerationHistory = {
    id: historyIdCounter++,
    raw_input: rawInput,
    input_method: inputMethod,
    detected_intent: detectedIntent,
    technique_used: techniqueUsed,
    generated_prompt: generatedPrompt,
    is_saved: false,
    created_at: new Date().toISOString(),
  };

  generationHistory.unshift(entry);

  return {
    id: entry.id,
    raw_input: entry.raw_input,
    detected_intent: entry.detected_intent,
    technique_used: entry.technique_used,
    generated_prompt: entry.generated_prompt,
    created_at: entry.created_at,
  };
}

const app = express();
const PORT = Number(process.env.PORT) || 10000;

// CORS setup for Render deployments linked to Vercel
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.replace(/\/+$/, ''), 'http://localhost:3000', 'http://localhost:5173']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Root & Health check
app.get("/", (_req, res) => {
  res.json({
    name: "PromptMate API Service",
    status: "healthy",
    description: "Backend API for PromptMate AI prompt agent",
    endpoints: {
      health: "/api/health",
      generate: "POST /api/prompts/generate",
      history: "GET /api/history",
      saved: "GET /api/saved",
      templates: "GET /api/templates",
      stats: "GET /api/stats",
      transcribe: "POST /api/speech/transcribe",
    },
  });
});

app.get("/api", (_req, res) => {
  res.json({ name: "PromptMate API", version: "1.0.0", status: "online" });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Prompt Generation
app.post("/api/prompts/generate", async (req, res) => {
  try {
    const { raw_input, input_method } = req.body;
    if (!raw_input || typeof raw_input !== "string") {
      return res.status(400).json({ detail: "raw_input is required" });
    }
    const result = await runPipeline(raw_input, input_method || "text");
    res.json(result);
  } catch (err: any) {
    console.error("Generate error:", err);
    res.status(500).json({ detail: err.message || "Prompt generation failed" });
  }
});

// Fast count statistics
app.get("/api/stats", (_req, res) => {
  res.json({
    historyCount: generationHistory.length,
    savedCount: savedPrompts.length,
    totalCount: generationHistory.length + savedPrompts.length,
  });
});

// History & Saved routes
app.get("/api/prompts/history", (_req, res) => {
  res.json(generationHistory.slice(0, 50));
});

app.get("/api/prompts/saved", (_req, res) => {
  res.json(savedPrompts);
});

app.get("/api/prompts/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ detail: "Invalid prompt ID" });
  }
  const entry = generationHistory.find(h => h.id === id);
  if (!entry) {
    return res.status(404).json({ detail: "Prompt generation history not found" });
  }
  res.json(entry);
});

app.get("/api/history", (_req, res) => {
  res.json(generationHistory.slice(0, 50));
});

app.delete("/api/history/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = generationHistory.findIndex(h => h.id === id);
  if (index === -1) {
    return res.status(404).json({ detail: "History not found" });
  }
  generationHistory.splice(index, 1);
  res.json({ status: "success" });
});

app.post("/api/history/:id/save", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const history = generationHistory.find(h => h.id === id);
  if (!history) {
    return res.status(404).json({ detail: "History not found" });
  }

  const { title, prompt_text, category } = req.body;
  const saved: SavedPrompt = {
    id: savedIdCounter++,
    title: title || "Saved Prompt",
    prompt_text: prompt_text || history.generated_prompt,
    category: category || history.detected_intent,
    history_id: id,
    created_at: new Date().toISOString(),
  };

  savedPrompts.unshift(saved);
  history.is_saved = true;
  res.json(saved);
});

app.get("/api/saved", (_req, res) => {
  res.json(savedPrompts);
});

app.delete("/api/saved/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = savedPrompts.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ detail: "Saved prompt not found" });
  }

  const saved = savedPrompts[index];
  if (saved.history_id) {
    const history = generationHistory.find(h => h.id === saved.history_id);
    if (history) {
      history.is_saved = false;
    }
  }

  savedPrompts.splice(index, 1);
  res.json({ status: "success" });
});

// Templates
app.get("/api/templates", (req, res) => {
  const category = req.query.category as string | undefined;
  if (category) {
    res.json(promptTemplates.filter(t => t.category === category));
  } else {
    res.json(promptTemplates);
  }
});

app.get("/api/templates/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const template = promptTemplates.find(t => t.id === id);
  if (!template) {
    return res.status(404).json({ detail: "Template not found" });
  }
  res.json(template);
});

app.post("/api/templates", (req, res) => {
  const { category, technique, name, template_text } = req.body;
  const newTemplate: PromptTemplate = {
    id: templateIdCounter++,
    category: category || "general",
    technique: technique || "zero_shot",
    name: name || "Custom Template",
    template_text: template_text || "{user_input}",
    created_at: new Date().toISOString(),
  };
  promptTemplates.push(newTemplate);
  res.json(newTemplate);
});

function detectAudioMimeType(buffer: Buffer, fallbackHeaderMime?: string): string {
  if (buffer && buffer.length >= 4) {
    // WebM / Matroska: 1A 45 DF A3
    if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
      return "audio/webm";
    }
    // WAV: RIFF .... WAVE
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.length >= 12 &&
      buffer.toString("ascii", 8, 12) === "WAVE"
    ) {
      return "audio/wav";
    }
    // OGG: OggS
    if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      return "audio/ogg";
    }
    // MP4 / M4A: .... ftyp
    if (buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp") {
      return "audio/mp4";
    }
    // MP3: ID3 or sync frame
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return "audio/mp3";
    }
    if (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2)) {
      return "audio/mp3";
    }
    // FLAC: fLaC
    if (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43) {
      return "audio/flac";
    }
  }

  const raw = (fallbackHeaderMime || "").split(";")[0].trim().toLowerCase();
  if (raw.startsWith("audio/")) {
    return raw;
  }
  return "audio/webm";
}

// Speech Transcription via Gemini
app.post("/api/speech/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: "No audio file received" });
    }

    const mimeType = detectAudioMimeType(
      req.file.buffer,
      (req.body?.mime_type as string) || req.file.mimetype
    );
    const base64Audio = req.file.buffer.toString("base64");
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(500).json({ detail: "Gemini client unavailable. Set GEMINI_API_KEY." });
    }

    const candidateModels = getOrderedCandidateModels([
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.5-transcribe",
    ]);

    let transcribedText = "";
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
            {
              text: "Transcribe the spoken audio verbatim into clean English text. Do not add conversational remarks, explanations, timestamps, or quotes. Output ONLY the transcribed spoken text.",
            },
          ],
        });

        const candidateText = response.text ? response.text.trim() : "";
        if (candidateText) {
          transcribedText = candidateText;
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        const errMsg = (modelErr?.message || String(modelErr)).toLowerCase();
        if (errMsg.includes("429") || errMsg.includes("quota")) {
          markModelCooldown(model, modelErr);
        }
      }
    }

    if (!transcribedText) {
      throw new Error(lastError?.message || "Could not transcribe audio.");
    }

    res.json({ text: transcribedText, language: "en", duration: 0.0 });
  } catch (err: any) {
    console.error("Speech transcription failed:", err.message || err);
    res.status(500).json({ detail: err.message || "Transcription failed" });
  }
});

app.post("/api/speech/transcribe-and-generate", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: "No audio file received" });
    }

    const rawMime = (req.file.mimetype || "audio/webm").split(";")[0].trim().toLowerCase();
    const mimeType = rawMime.startsWith("audio/") ? rawMime : "audio/webm";
    const base64Audio = req.file.buffer.toString("base64");
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(500).json({ detail: "Gemini client unavailable." });
    }

    const candidateModels = getOrderedCandidateModels([
      "gemini-3.5-transcribe",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
    ]);

    let transcribedText = "";
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
            {
              text: "Transcribe the spoken audio verbatim into clean English text. Output ONLY the transcribed spoken text.",
            },
          ],
        });
        const candidateText = response.text ? response.text.trim() : "";
        if (candidateText) {
          transcribedText = candidateText;
          break;
        }
      } catch (modelErr: any) {
        const errMsg = (modelErr?.message || String(modelErr)).toLowerCase();
        if (errMsg.includes("429") || errMsg.includes("quota")) {
          markModelCooldown(model, modelErr);
        }
      }
    }

    if (!transcribedText) {
      return res.status(500).json({ detail: "Could not transcribe audio." });
    }

    const result = await runPipeline(transcribedText, "voice");
    res.json({
      transcription: transcribedText,
      ...result,
    });
  } catch (err: any) {
    console.error("Transcribe-and-generate failed:", err);
    res.status(500).json({ detail: err.message || "Failed to transcribe and generate prompt" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PromptMate backend server listening on 0.0.0.0:${PORT}`);
});
