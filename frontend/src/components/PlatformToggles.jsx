import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Zap, ArrowUpRight } from 'lucide-react';
import { PLATFORMS, copyAndRedirectToPlatform, copyToClipboard } from '../utils/platformLaunch';

export default function PlatformToggles({ promptText, rawInput, onToast }) {
  const [activePlatform, setActivePlatform] = useState('chatgpt');
  const [copied, setCopied] = useState(false);
  const [lastLaunched, setLastLaunched] = useState(null);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const basePrompt = promptText || rawInput || '';
  const currentConfig = PLATFORMS.find((p) => p.id === activePlatform) || PLATFORMS[0];
  const transformedText = currentConfig.transform(basePrompt);

  const handleToggleClick = async (platformId) => {
    setActivePlatform(platformId);

    if (autoRedirect && basePrompt.trim()) {
      await handleLaunchPlatform(platformId);
    }
  };

  const handleLaunchPlatform = async (platformId = activePlatform) => {
    if (!basePrompt.trim()) return;

    try {
      const result = await copyAndRedirectToPlatform(platformId, basePrompt);
      setLastLaunched(result.platform.name);

      const msg = result.supportsUrlParam
        ? `Prompt copied & opening ${result.platform.name} with auto-fill!`
        : `Prompt copied to clipboard! Opening ${result.platform.name} (paste with Ctrl+V)`;

      if (onToast) {
        onToast(msg);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setLastLaunched(null), 3000);
    } catch (err) {
      console.error('Launch failed:', err);
    }
  };

  const handleCopyOnly = async () => {
    if (!transformedText) return;
    const success = await copyToClipboard(transformedText);
    if (success) {
      setCopied(true);
      if (onToast) onToast(`Copied ${currentConfig.name} prompt to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pm-platform-container">
      {/* Auto-redirect indicator header */}
      <div className="pm-platform-header-row">
        <div className="pm-platform-title-group">
          <Zap size={14} className="pm-icon-highlight" />
          <span className="pm-platform-header-title">Platform Direct Export & Auto-Paste</span>
        </div>

        <label className="pm-auto-redirect-toggle" title="When clicked, opens target AI platform with prompt copied/pre-filled">
          <input
            type="checkbox"
            checked={autoRedirect}
            onChange={(e) => setAutoRedirect(e.target.checked)}
          />
          <span className="pm-toggle-label">Auto-redirect on toggle</span>
        </label>
      </div>

      {/* Platform Toggles */}
      <div className="pm-platform-tabs" role="tablist">
        {PLATFORMS.map((plat) => {
          const isActive = activePlatform === plat.id;
          return (
            <button
              key={plat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`pm-platform-tab ${isActive ? 'pm-platform-tab-active' : ''}`}
              onClick={() => handleToggleClick(plat.id)}
              title={`Click to switch & redirect to ${plat.name} with prompt pre-filled`}
            >
              <span className="pm-platform-name">{plat.name}</span>
              <span className="pm-platform-brand-badge">{plat.brand}</span>
              <ArrowUpRight size={12} className="pm-platform-external-icon" />
            </button>
          );
        })}
      </div>

      {/* Feedback Alert if recently launched */}
      {lastLaunched && (
        <div className="pm-platform-launch-alert">
          <Check size={14} className="pm-text-accent" />
          <span>
            <strong>{lastLaunched}</strong> opened in a new tab. Transformed prompt is copied to your clipboard ready to paste!
          </span>
        </div>
      )}

      {/* Code preview & Action bar */}
      <div className="pm-platform-content">
        <div className="pm-platform-meta">
          <div className="pm-platform-meta-left">
            <span className="pm-platform-desc">{currentConfig.prefix}</span>
            <span className="pm-platform-tip-text">{currentConfig.tips}</span>
          </div>

          <div className="pm-platform-actions">
            <button
              type="button"
              className="pm-btn pm-btn-sm pm-copy-btn"
              onClick={handleCopyOnly}
              title="Copy prompt only without opening external website"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              className="pm-btn pm-btn-sm pm-btn-primary pm-launch-btn"
              onClick={() => handleLaunchPlatform(currentConfig.id)}
              title={`Open ${currentConfig.name} and paste prompt`}
            >
              <ExternalLink size={14} />
              <span>Open in {currentConfig.name} & Paste</span>
            </button>
          </div>
        </div>

        <pre className="pm-platform-code">
          <code>{transformedText}</code>
        </pre>
      </div>
    </div>
  );
}
