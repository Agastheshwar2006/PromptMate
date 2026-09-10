import { useState } from 'react';
import { ExternalLink, Copy, Check, Sparkles } from 'lucide-react';

const AI_PLATFORMS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    company: 'OpenAI',
    badge: 'GPT-4o',
    color: '#059669',
    bgLight: '#f0fdf4',
    borderColor: '#86efac',
    iconText: 'GPT',
    buildUrl: (prompt) => 'https://chatgpt.com/?q=' + encodeURIComponent(prompt),
  },
  {
    id: 'claude',
    name: 'Claude',
    company: 'Anthropic',
    badge: 'Sonnet 3.5',
    color: '#d97706',
    bgLight: '#fffbeb',
    borderColor: '#fde68a',
    iconText: 'Claude',
    buildUrl: (prompt) => 'https://claude.ai/new?q=' + encodeURIComponent(prompt),
  },
  {
    id: 'gemini',
    name: 'Gemini',
    company: 'Google',
    badge: '1.5 Pro',
    color: '#2563eb',
    bgLight: '#eff6ff',
    borderColor: '#bfdbfe',
    iconText: 'Gemini',
    buildUrl: (prompt) => 'https://gemini.google.com/app?q=' + encodeURIComponent(prompt),
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    company: 'Perplexity AI',
    badge: 'Search',
    color: '#0d9488',
    bgLight: '#f0fdfa',
    borderColor: '#99f6e4',
    iconText: 'Perplexity',
    buildUrl: (prompt) => 'https://www.perplexity.ai/search?q=' + encodeURIComponent(prompt),
  },
  {
    id: 'copilot',
    name: 'Copilot',
    company: 'Microsoft',
    badge: 'GPT-4',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    borderColor: '#bae6fd',
    iconText: 'Copilot',
    buildUrl: (prompt) => 'https://copilot.microsoft.com/?q=' + encodeURIComponent(prompt),
  },
];

export default function PlatformToggles({ promptText }) {
  const [copiedId, setCopiedId] = useState(null);
  const [activePlatform, setActivePlatform] = useState('chatgpt');

  if (!promptText) return null;

  const handleLaunch = (platform) => {
    setActivePlatform(platform.id);
    const url = platform.buildUrl(promptText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAndLaunch = async (e, platform) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedId(platform.id);
      setTimeout(() => setCopiedId(null), 2000);
      handleLaunch(platform);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="platform-toggles-section">
      <div className="platform-toggles-header">
        <div className="platform-toggles-title">
          <Sparkles size={18} className="text-emerald" />
          <span>Launch Prompt in AI Model</span>
        </div>
        <span className="platform-toggles-sub">
          Select an AI model to open with your optimized prompt
        </span>
      </div>

      <div className="platform-grid">
        {AI_PLATFORMS.map((platform) => {
          const isSelected = activePlatform === platform.id;
          const isCopied = copiedId === platform.id;

          return (
            <div
              key={platform.id}
              className={`platform-card ${isSelected ? 'platform-card--active' : ''}`}
              onClick={() => handleLaunch(platform)}
              role="button"
              tabIndex={0}
            >
              <div className="platform-card__left">
                <div className="platform-card__avatar">
                  <span className="platform-card__icon-text">
                    {platform.iconText}
                  </span>
                </div>
                <div className="platform-card__info">
                  <div className="platform-card__name-row">
                    <span className="platform-card__name">{platform.name}</span>
                    <span className="platform-card__badge">{platform.badge}</span>
                  </div>
                  <span className="platform-card__desc">{platform.company}</span>
                </div>
              </div>

              <div className="platform-card__actions">
                <button
                  type="button"
                  className="platform-btn-copy"
                  title="Copy prompt & open"
                  onClick={(e) => handleCopyAndLaunch(e, platform)}
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied!' : 'Copy & Open'}</span>
                </button>
                <div className="platform-btn-arrow">
                  <ExternalLink size={15} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
