import React, { useState } from 'react';
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import VoiceInput from './VoiceInput';
import TemplateSelector from './TemplateSelector';

export default function PromptInput({
  onSubmit,
  isLoading,
  initialValue = '',
  onVoiceTranscribed,
}) {
  const [input, setInput] = useState(initialValue);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim(), selectedCategory);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const handleVoiceTranscribe = (text) => {
    if (!text || !text.trim()) return;
    setInput((prev) => {
      const trimmed = (prev || '').trim();
      return trimmed ? `${trimmed} ${text.trim()}` : text.trim();
    });
    if (onVoiceTranscribed) {
      onVoiceTranscribed(text.trim());
    }
  };

  return (
    <div className="pm-input-card">
      <div className="pm-input-header">
        <div className="pm-input-label-group">
          <Sparkles className="pm-icon-sparkle" size={16} />
          <span className="pm-input-label">Raw Idea or Concept</span>
        </div>
        <TemplateSelector
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      <div className="pm-textarea-wrapper">
        <textarea
          className="pm-textarea"
          rows={4}
          placeholder="e.g. Build a modern landing page for an AI agent with dark mode and pricing cards..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        <div className="pm-input-toolbar">
          <div className="pm-toolbar-left">
            <VoiceInput
              onTranscription={handleVoiceTranscribe}
              disabled={isLoading}
            />
            <span className="pm-hint">Cmd + Enter to generate</span>
          </div>

          <button
            className="pm-submit-btn"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Wand2 className="pm-spin" size={16} />
                <span>Enhancing...</span>
              </>
            ) : (
              <>
                <span>Enhance Prompt</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
