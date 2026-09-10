import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function PromptInput({ onGenerate }) {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await onGenerate(value.trim(), 'text');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="prompt-input">
      <div className="prompt-input__header">
        <label htmlFor="prompt-textarea" className="prompt-input__title">
          Your Prompt Idea
        </label>
        <span className="prompt-input__hint">Press Ctrl + Enter to generate</span>
      </div>

      <textarea
        id="prompt-textarea"
        className="prompt-input__textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type or paste your raw prompt idea here... (e.g. 'Create a full marketing strategy for a sustainable coffee brand with target personas and content calendar')"
        rows={4}
      />

      <div className="prompt-input__footer">
        <button
          className="prompt-input__submit-btn"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          type="button"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Optimizing Prompt...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate Prompt</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
