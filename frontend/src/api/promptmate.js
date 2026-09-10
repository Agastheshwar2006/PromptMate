import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function generatePrompt(rawInput, inputMethod = 'text') {
  const res = await api.post('/prompts/generate', {
    raw_input: rawInput,
    input_method: inputMethod,
  });
  return res.data;
}

export async function getHistory() {
  const res = await api.get('/history');
  return res.data;
}

export async function deleteHistory(id) {
  const res = await api.delete(`/history/${id}`);
  return res.data;
}

export async function savePrompt(historyId, data) {
  const res = await api.post(`/history/${historyId}/save`, data);
  return res.data;
}

export async function getSavedPrompts() {
  const res = await api.get('/saved');
  return res.data;
}

export async function getTemplates(category = null) {
  const params = category ? { category } : {};
  const res = await api.get('/templates', { params });
  return res.data;
}

export async function transcribeAudio(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  const res = await api.post('/speech/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function transcribeAndGenerate(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  const res = await api.post('/speech/transcribe-and-generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
