import { ExternalLink, AlertTriangle } from 'lucide-react';

const PLATFORMS = [
  {
    name: 'Claude',
    color: '#d97706',
    bgColor: '#d9770615',
    emoji: '🟤',
    buildUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: 'ChatGPT',
    color: '#10a37f',
    bgColor: '#10a37f15',
    emoji: '🟢',
    buildUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: 'Gemini',
    color: '#4285f4',
    bgColor: '#4285f415',
    emoji: '🔵',
    buildUrl: (prompt) => `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: 'Copilot',
    color: '#7c3aed',
    bgColor: '#7c3aed15',
    emoji: '🟣',
    buildUrl: (prompt) => `https://copilot.microsoft.com/?q=${encodeURIComponent(prompt)}`,
  },
];

const URL_LENGTH_WARNING = 8000;

export default function TalkingButtons({ promptText }) {
  if (!promptText) return null;

  const isLong = promptText.length > URL_LENGTH_WARNING;

  const handleClick = (platform) => {
    const url = platform.buildUrl(promptText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="talking-buttons">
      <h3 className="talking-buttons__title">
        <ExternalLink size={16} />
        Quick Launch
      </h3>

      {isLong && (
        <div className="talking-buttons__warning">
          <AlertTriangle size={14} />
          Prompt is very long ({promptText.length} chars). Some platforms may truncate the URL.
        </div>
      )}

      <div className="talking-buttons__row">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.name}
            className="talking-buttons__btn"
            style={{
              '--btn-color': platform.color,
              '--btn-bg': platform.bgColor,
            }}
            onClick={() => handleClick(platform)}
            type="button"
          >
            <span className="talking-buttons__emoji">{platform.emoji}</span>
            Open in {platform.name}
          </button>
        ))}
      </div>
    </div>
  );
}
