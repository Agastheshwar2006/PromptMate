import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Library,
} from 'lucide-react';
import PromptInput from '../components/PromptInput';
import PromptOutput from '../components/PromptOutput';
import HistoryPanel from '../components/HistoryPanel';
import { generatePrompt, savePrompt, getStats } from '../api/promptmate';

export default function Home() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pm_theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'dark';
  });

  const [generatedData, setGeneratedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Efficient count synchronization for library badge
  useEffect(() => {
    let isMounted = true;
    const loadCounts = async () => {
      try {
        const stats = await getStats();
        if (isMounted && typeof stats?.totalCount === 'number') {
          setHistoryCount(stats.totalCount);
        }
      } catch (_e) {
        // graceful silent fallback
      }
    };
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleGenerate = async (rawInput, categoryContext) => {
    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const data = await generatePrompt(rawInput, categoryContext);
      setGeneratedData(data);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Failed to enhance prompt. Please check connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (id) => {
    if (!id || isSaved) return;
    try {
      await savePrompt(id);
      setIsSaved(true);
      setRefreshTrigger((prev) => prev + 1);
      showToast('Prompt saved to your library');
    } catch (err) {
      showToast('Error saving prompt');
    }
  };

  const handleSelectFromHistory = (item) => {
    setGeneratedData({
      id: item.id,
      raw_input: item.raw_input,
      detected_intent: item.detected_intent,
      technique_used: item.technique_used,
      generated_prompt: item.generated_prompt,
      created_at: item.created_at,
    });
    setIsSaved(!!item.is_saved);
    setIsLibraryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pm-app">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pm-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="pm-header">
        <div className="pm-header-inner">
          <div className="pm-brand">
            <div className="pm-logo-icon">
              <Sparkles size={20} className="pm-logo-spark" />
            </div>
            <div className="pm-brand-text">
              <span className="pm-app-name">PromptMate</span>
              <span className="pm-app-tag">Prompt Engineering Agent</span>
            </div>
          </div>

          <div className="pm-header-actions">
            <button
              type="button"
              className="pm-btn pm-btn-ghost pm-lib-toggle-btn"
              onClick={() => setIsLibraryOpen(true)}
              aria-label="Open library"
            >
              <Library size={16} />
              <span>Library</span>
              {historyCount > 0 && (
                <span className="pm-badge-count">{historyCount}</span>
              )}
            </button>

            <button
              type="button"
              className="pm-btn pm-btn-icon"
              onClick={toggleTheme}
              aria-label="Toggle monochrome mode"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pm-main">
        <div className="pm-container">
          {/* Hero Section */}
          <div className="pm-hero-section">
            <h1 className="pm-hero-title">Precision Prompt Synthesis</h1>
            <p className="pm-hero-subtitle">
              Transform raw intentions into robust, framework-aligned prompts tailored for ChatGPT, Claude, Gemini, Midjourney, and Sora.
            </p>
          </div>

          {/* Prompt Input Form */}
          <section className="pm-input-section">
            <PromptInput
              onSubmit={handleGenerate}
              isLoading={isLoading}
              onVoiceTranscribed={(_text) => {
                showToast('Voice transcribed successfully');
              }}
            />
          </section>

          {/* Prompt Output Card */}
          {generatedData && (
            <section className="pm-output-section">
              <PromptOutput
                data={generatedData}
                onSave={handleSave}
                isSaved={isSaved}
                onRefine={(modifier) =>
                  handleGenerate(
                    `${generatedData.raw_input} (Refinement: ${modifier})`
                  )
                }
                isRefining={isLoading}
                error={error}
              />
            </section>
          )}

          {error && !generatedData && (
            <div className="pm-alert-box">
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>

      {/* Slide-over Library Panel */}
      <HistoryPanel
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectPrompt={handleSelectFromHistory}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
