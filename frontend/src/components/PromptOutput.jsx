import React, { useState } from 'react';
import { Copy, Check, Bookmark, Sparkles, Sliders, Layers } from 'lucide-react';
import PlatformToggles from './PlatformToggles';

export default function PromptOutput({
  data,
  onSave,
  isSaved,
  onRefine,
  isRefining,
  error,
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'platform'

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
    setTimeout(() => setCopied(false), 2000);
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
          <span>Platform Variations</span>
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
        />
      )}
    </div>
  );
}
