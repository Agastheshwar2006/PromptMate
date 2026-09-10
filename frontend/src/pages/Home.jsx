import { useState } from 'react';
import { Sparkles, ArrowRight, Bot, ShieldCheck, History, Trash2, Clock } from 'lucide-react';
import PromptInput from '../components/PromptInput';
import PromptOutput from '../components/PromptOutput';
import PlatformToggles from '../components/PlatformToggles';
import TemplateSelector from '../components/TemplateSelector';
import { generatePrompt, savePrompt, getHistory, deleteHistory } from '../api/promptmate';

export default function Home() {
  const [result, setResult] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistoryItems(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleGenerate = async (rawInput, inputMethod) => {
    setError(null);
    try {
      const data = await generatePrompt(rawInput, inputMethod);
      setResult(data);
      loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Generation failed. Please make sure the backend is running with a valid OpenAI key.'
      );
    }
  };

  const handleHistorySelect = (item) => {
    setResult({
      id: item.id,
      raw_input: item.raw_input,
      detected_intent: item.detected_intent,
      technique_used: item.technique_used,
      generated_prompt: item.generated_prompt,
      created_at: item.created_at,
    });
    setShowHistory(false);
  };

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteHistory(id);
      setHistoryItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (title, promptText) => {
    if (!result) return;
    try {
      await savePrompt(result.id, {
        title,
        prompt_text: promptText,
        category: result.detected_intent,
      });
      loadHistory();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  return (
    <div className="pm-container">
      {/* Top Clean Header */}
      <header className="pm-navbar">
        <div className="pm-navbar__brand">
          <div className="pm-brand-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="pm-brand-title">PromptMate</h1>
            <p className="pm-brand-tagline">AI Prompt Engineering & Multi-Model Launcher</p>
          </div>
        </div>

        <div className="pm-navbar__actions">
          <button
            type="button"
            className={pm-nav-btn }
            onClick={() => {
              if (!showHistory) loadHistory();
              setShowHistory(!showHistory);
            }}
          >
            <History size={16} />
            <span>History</span>
          </button>
        </div>
      </header>

      {/* History Drawer Modal / Popup */}
      {showHistory && (
        <div className="pm-history-dropdown">
          <div className="pm-history-dropdown__header">
            <h3>Recent Prompts</h3>
            <button
              type="button"
              className="pm-history-close"
              onClick={() => setShowHistory(false)}
            >
              ✕
            </button>
          </div>
          <div className="pm-history-dropdown__list">
            {historyItems.length === 0 ? (
              <div className="pm-history-empty">No prompt history found.</div>
            ) : (
              historyItems.map((item) => (
                <div
                  key={item.id}
                  className="pm-history-card"
                  onClick={() => handleHistorySelect(item)}
                >
                  <div className="pm-history-card__text">{item.raw_input}</div>
                  <div className="pm-history-card__meta">
                    <span className="pm-badge-intent">{item.detected_intent}</span>
                    <button
                      type="button"
                      className="pm-history-delete-btn"
                      onClick={(e) => handleDeleteHistory(e, item.id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Streamlined Studio */}
      <main className="pm-studio">
        {/* Category Pills */}
        <div className="pm-section-card pm-category-section">
          <div className="pm-card-header-simple">
            <span className="pm-eyebrow">Category (Optional)</span>
          </div>
          <TemplateSelector selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        {/* Input Box */}
        <div className="pm-section-card pm-input-card">
          <PromptInput onGenerate={handleGenerate} />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="pm-alert-error">
            <span className="pm-alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Prompt Output Card */}
        {result && (
          <div className="pm-section-card pm-output-section">
            <PromptOutput result={result} onSave={handleSave} />
            
            {/* Multi-Model Platform Toggles directly after prompt output */}
            <PlatformToggles promptText={result.generated_prompt} />
          </div>
        )}
      </main>
    </div>
  );
}
