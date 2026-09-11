import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    prefix: 'Direct & Action-Oriented',
    transform: (prompt) => prompt,
  },
  {
    id: 'claude',
    name: 'Claude',
    prefix: 'XML Tags & Context Framing',
    transform: (prompt) => {
      return `<system_context>\nYou are an AI assistant tasked with executing instructions with precision and analytical depth.\n</system_context>\n\n<user_instructions>\n${prompt}\n</user_instructions>\n\n<guidelines>\n- Provide structured, exhaustive analysis.\n- Think carefully before executing.\n</guidelines>`;
    },
  },
  {
    id: 'gemini',
    name: 'Gemini',
    prefix: 'Multi-Perspective Grounding',
    transform: (prompt) => {
      return `[Context & Grounding]\nPlease approach the following task with comprehensive coverage, validating logical edge cases and maintaining clarity.\n\nTask:\n${prompt}\n\nDeliverable Format:\nProvide the core response first, followed by key considerations and alternative approaches if relevant.`;
    },
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    prefix: 'Visual Prompt Formula',
    transform: (prompt) => {
      const cleanPrompt = (prompt || '')
        .replace(/act as.*?\./gi, '')
        .replace(/please generate.*?\./gi, '')
        .trim();
      return `/imagine prompt: ${cleanPrompt} --ar 16:9 --style raw --v 6.1`;
    },
  },
  {
    id: 'sora',
    name: 'Sora / Video',
    prefix: 'Cinematographic Framing',
    transform: (prompt) => {
      return `Cinematic 4K hyper-detailed footage. ${prompt}. Smooth camera movement, natural depth of field, photorealistic rendering, 60fps pacing, cinematic lighting.`;
    },
  },
];

export default function PlatformToggles({ promptText, rawInput }) {
  const [activePlatform, setActivePlatform] = useState('chatgpt');
  const [copied, setCopied] = useState(false);

  const currentConfig = PLATFORMS.find((p) => p.id === activePlatform) || PLATFORMS[0];
  const transformedText = currentConfig.transform(promptText || rawInput || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(transformedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pm-platform-container">
      <div className="pm-platform-tabs">
        {PLATFORMS.map((plat) => {
          const isActive = activePlatform === plat.id;
          return (
            <button
              key={plat.id}
              type="button"
              className={`pm-platform-tab ${isActive ? 'pm-platform-tab-active' : ''}`}
              onClick={() => setActivePlatform(plat.id)}
            >
              <span className="pm-platform-name">{plat.name}</span>
              <span className="pm-platform-prefix-badge">{plat.prefix.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      <div className="pm-platform-content">
        <div className="pm-platform-meta">
          <span className="pm-platform-desc">{currentConfig.prefix}</span>
          <button
            type="button"
            className="pm-btn pm-btn-sm pm-copy-btn"
            onClick={handleCopy}
            title="Copy platform-specific prompt"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <pre className="pm-platform-code">
          <code>{transformedText}</code>
        </pre>
      </div>
    </div>
  );
}
