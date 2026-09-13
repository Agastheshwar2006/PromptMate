import React, { useState } from 'react';
import { Copy, Check, Bookmark, Sparkles, Sliders, Layers, ArrowUpRight, Zap } from 'lucide-react';
import PlatformToggles from './PlatformToggles';
import { PLATFORMS, copyAndRedirectToPlatform } from '../utils/platformLaunch';

export default function PromptOutput({
  data,
  onSave,
  isSaved,
  onRefine,
  isRefining,
  error,
  onToast,
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'platform'
  const [quickLaunchActive, setQuickLaunchActive] = useState(null);

  if (error) {
    return (
      <div className="pm-output pm-output-error">
        <div className="pm-error-title">Generation Error</div>
        <div className="pm-error-msg">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const handleCopy = () => {
    if (!data.generated_prompt) return;
    navigator.clipboard.writeText(data.generated_prompt);
    setCopied(true);
    if (onToast) onToast('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickLaunch = async (platformId) => {
    if (!data.generated_prompt) return;
    try {
      setQuickLaunchActive(platformId);
      const result = await copyAndRedirectToPlatform(platformId, data.generated_prompt);

      const msg = result.supportsUrlParam
        ? `Prompt copied & opening ${result.platform.name} with auto-fill!`
        : `Prompt copied to clipboard! Opening ${result.platform.name} (paste with Ctrl+V)`;

      if (onToast) onToast(msg);
      setTimeout(() => setQuickLaunchActive(null), 2000);
    } catch (e) {
      console.error('Quick launch error:', e);
      setQuickLaunchActive(null);
    }
  };

  const REFINEMENT_OPTIONS = [
    'Add edge-case validation',
    'Make it more concise',
    'Add step-by-step breakdown',
    'Tailor for junior developers',
  ];

  return (
    <div className="pm-card pm-output-card">
      <div className="pm-output-header">
        <div className="pm-meta-badges">
          <span className="pm-badge pm-badge-primary">
            {data.detected_intent?.replace('_', ' ').toUpperCase() || 'GENERAL'}
          </span>
          <span className="pm-badge pm-badge-muted">
            {data.technique_used?.replace('_', ' ') || 'PROMPT'}
          </span>
        </div>

        <div className="pm-output-actions">
          <button
            type="button"
            className={`pm-btn pm-btn-sm ${isSaved ? 'pm-btn-saved' : 'pm-btn-outline'}`}
            onClick={() => onSave(data.id)}
            disabled={isSaved}
          >
            <Bookmark size={14} className={isSaved ? 'pm-icon-filled' : ''} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            className="pm-btn pm-btn-sm pm-btn-primary"
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Quick Launch & Auto-Paste Bar */}
      <div className="pm-quick-launch-bar">
        <div className="pm-quick-launch-label">
          <Zap size={13} className="pm-text-accent" />
          <span>Launch & Auto-Paste:</span>
        </div>
        <div className="pm-quick-launch-pills">
          {PLATFORMS.slice(0, 6).map((plat) => (
            <button
              key={plat.id}
              type="button"
              className={`pm-quick-pill ${quickLaunchActive === plat.id ? 'pm-quick-pill-active' : ''}`}
              onClick={() => handleQuickLaunch(plat.id)}
              title={`Click to copy prompt and open ${plat.name} in a new tab`}
            >
              <span>{plat.name}</span>
              <ArrowUpRight size={11} className="pm-quick-arrow" />
            </button>
          ))}
        </div>
      </div>

      <div className="pm-output-tabs">
        <button
          type="button"
          className={`pm-tab-btn ${activeTab === 'full' ? 'pm-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('full')}
        >
          <Sparkles size={14} />
          <span>Synthesized Prompt</span>
        </button>
        <button
          type="button"
          className={`pm-tab-btn ${activeTab === 'platform' ? 'pm-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('platform')}
        >
          <Layers size={14} />
          <span>Platform Variations & Redirect</span>
        </button>
      </div>

      {activeTab === 'full' ? (
        <div className="pm-prompt-body">
          <div className="pm-prompt-text-wrapper">
            <pre className="pm-prompt-text">{data.generated_prompt}</pre>
          </div>

          <div className="pm-refinement-group">
            <div className="pm-refine-label">
              <Sliders size={13} />
              <span>Quick Refinements:</span>
            </div>
            <div className="pm-refine-pills">
              {REFINEMENT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="pm-pill-btn"
                  onClick={() => onRefine(opt)}
                  disabled={isRefining}
                >
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <PlatformToggles
          promptText={data.generated_prompt}
          rawInput={data.raw_input}
          onToast={onToast}
        />
      )}
    </div>
  );
}
