import axios from 'axios';

// Resolve API base URL dynamically for local dev, Render, Vercel, and custom deployments
let resolvedBase = (
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  '/api'
).trim().replace(/\/+$/, '');

// If user supplies backend root domain without /api (e.g. https://promptmate.onrender.com), auto-append /api
if (resolvedBase && !resolvedBase.endsWith('/api') && resolvedBase.startsWith('http')) {
  resolvedBase = `${resolvedBase}/api`;
}

const api = axios.create({
  baseURL: resolvedBase,
  timeout: 30000,
});

// Client-side fallback templates for standalone / Vercel static deployments
const FALLBACK_TEMPLATES = {
  coding: {
    intent: 'coding',
    technique: 'chain_of_thought',
    format: (input) => `Act as a Senior Software Engineer. Please write clean, modular, and production-ready code for the following task:\n\nTask:\n${input}\n\nBefore writing the solution, think step-by-step:\n1. Architecture & Logic: Outline the algorithmic approach and data flow.\n2. Edge Cases: Identify error handling, input validation, and boundaries.\n3. Implementation: Provide complete code with concise comments and type annotations.\n4. Verification: Include test cases or usage examples.`,
  },
  image_generation: {
    intent: 'image_generation',
    technique: 'structured',
    format: (input) => `High-resolution photorealistic masterwork: ${input}. 8k resolution, cinematic volumetric lighting, shot on 35mm lens f/1.8, intricate texture details, balanced color grading, hyper-detailed, masterpiece composition, award-winning photography.`,
  },
  video_generation: {
    intent: 'video_generation',
    technique: 'structured',
    format: (input) => `Cinematic 4K hyper-detailed footage: ${input}. Smooth camera tracking shot, natural depth of field, photorealistic rendering, 60fps pacing, cinematic color palette, dynamic atmospheric lighting.`,
  },
  creative_writing: {
    intent: 'creative_writing',
    technique: 'persona',
    format: (input) => `Act as an award-winning author and storyteller. Write a compelling, immersive narrative based on:\n\nConcept:\n${input}\n\nGuidelines:\n- Employ vivid sensory details, distinct character voices, and evocative pacing.\n- Avoid generic clichés; focus on authentic emotional resonance and subtext.\n- Build dynamic tension and deliver a poignant, memorable conclusion.`,
  },
  data_analysis: {
    intent: 'data_analysis',
    technique: 'few_shot',
    format: (input) => `Act as a Lead Data Scientist and Analytics Consultant. Please analyze the following data problem:\n\nScenario:\n${input}\n\nDeliverables:\n1. Key Metrics & KPIs: Identify the quantitative signals to track.\n2. Exploratory Hypotheses: Propose data-driven hypotheses to test.\n3. Methodology: Recommend appropriate statistical models or analytical frameworks.\n4. Actionable Recommendations: Provide executive-ready strategic insights.`,
  },
  general: {
    intent: 'general',
    technique: 'zero_shot',
    format: (input) => `Please provide an expert, comprehensive, and structured response for the following objective:\n\nObjective:\n${input}\n\nConstraints:\n- Be clear, precise, and well-organized with Markdown headings.\n- Prioritize high-impact insights and actionable steps.\n- Highlight critical caveats and best practices.`,
  },
};

function detectFallbackCategory(input, explicitCategory = '') {
  if (explicitCategory && explicitCategory !== 'all' && FALLBACK_TEMPLATES[explicitCategory]) {
    return explicitCategory;
  }
  const lower = (input || '').toLowerCase();
  if (['code', 'script', 'python', 'javascript', 'bug', 'api', 'react', 'sql', 'css', 'html', 'database', 'algorithm'].some(k => lower.includes(k))) return 'coding';
  if (['image', 'photo', 'picture', 'draw', 'painting', 'illustration', 'render', 'portrait'].some(k => lower.includes(k))) return 'image_generation';
  if (['video', 'clip', 'animation', 'motion', 'cinematic', 'footage'].some(k => lower.includes(k))) return 'video_generation';
  if (['story', 'poem', 'essay', 'novel', 'write', 'dialogue', 'character', 'fiction'].some(k => lower.includes(k))) return 'creative_writing';
  if (['data', 'csv', 'chart', 'analyze', 'metrics', 'statistics', 'insights', 'analytics'].some(k => lower.includes(k))) return 'data_analysis';
  return 'general';
}

function getLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem('pm_history') || '[]');
  } catch {
    return [];
  }
}

function saveLocalHistory(items) {
  try {
    localStorage.setItem('pm_history', JSON.stringify(items.slice(0, 50)));
  } catch {}
}

function getLocalSaved() {
  try {
    return JSON.parse(localStorage.getItem('pm_saved') || '[]');
  } catch {
    return [];
  }
}

function saveLocalSaved(items) {
  try {
    localStorage.setItem('pm_saved', JSON.stringify(items.slice(0, 50)));
  } catch {}
}

export async function generatePrompt(raw_input, category_context = '') {
  try {
    const payload = { raw_input };
    if (category_context) {
      payload.raw_input = `[Category Context: ${category_context}] ${raw_input}`;
    }
    const res = await api.post('/prompts/generate', payload);
    if (res.data && res.data.generated_prompt) {
      // Keep local history in sync
      const hist = getLocalHistory();
      hist.unshift(res.data);
      saveLocalHistory(hist);
      return res.data;
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    // If backend is unavailable (e.g. static Vercel preview or network issue), use client fallback
    console.warn('Backend unavailable, using client-side prompt engine:', err?.message || err);
    const cat = detectFallbackCategory(raw_input, category_context);
    const template = FALLBACK_TEMPLATES[cat] || FALLBACK_TEMPLATES.general;
    const generated = template.format(raw_input);
    const entry = {
      id: Date.now(),
      raw_input,
      detected_intent: template.intent,
      technique_used: template.technique,
      generated_prompt: generated,
      created_at: new Date().toISOString(),
      is_saved: false,
    };
    const hist = getLocalHistory();
    hist.unshift(entry);
    saveLocalHistory(hist);
    return entry;
  }
}

export async function getStats() {
  try {
    const res = await api.get('/stats');
    if (res.data && typeof res.data.totalCount === 'number') {
      return res.data;
    }
  } catch {}
  const hist = getLocalHistory();
  const saved = getLocalSaved();
  return {
    historyCount: hist.length,
    savedCount: saved.length,
    totalCount: hist.length + saved.length,
  };
}

export async function getHistory() {
  try {
    const res = await api.get('/history');
    if (Array.isArray(res.data)) {
      saveLocalHistory(res.data);
      return res.data;
    }
  } catch {}
  return getLocalHistory();
}

export async function getSavedPrompts() {
  try {
    const res = await api.get('/prompts/saved');
    if (Array.isArray(res.data)) {
      saveLocalSaved(res.data);
      return res.data;
    }
  } catch {}
  return getLocalSaved();
}

export async function savePrompt(promptId) {
  try {
    const res = await api.post(`/history/${promptId}/save`);
    if (res.data) {
      return res.data;
    }
  } catch {}
  // Local fallback
  const hist = getLocalHistory();
  const target = hist.find((item) => String(item.id) === String(promptId));
  if (target) {
    target.is_saved = true;
    saveLocalHistory(hist);
    const saved = getLocalSaved();
    if (!saved.some((s) => String(s.id) === String(promptId))) {
      saved.unshift(target);
      saveLocalSaved(saved);
    }
  }
  return { status: 'success' };
}

export async function deleteHistoryItem(id) {
  try {
    await api.delete(`/history/${id}`);
  } catch {}
  const hist = getLocalHistory().filter((item) => String(item.id) !== String(id));
  saveLocalHistory(hist);
  return { status: 'success' };
}

export async function deleteSavedItem(id) {
  try {
    await api.delete(`/prompts/saved/${id}`);
  } catch {}
  const saved = getLocalSaved().filter((item) => String(item.id) !== String(id));
  saveLocalSaved(saved);
  return { status: 'success' };
}

export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.wav');
  const res = await api.post('/speech/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return res.data;
}

export default api;
