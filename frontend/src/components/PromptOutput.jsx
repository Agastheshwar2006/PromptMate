import { useState } from 'react';
import { Copy, Check, Save, Pencil, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PromptOutput({ result, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!result) return null;

  const displayPrompt = isEditing ? editedPrompt : result.generated_prompt;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedPrompt(result.generated_prompt);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    if (!saveTitle.trim()) return;
    onSave(saveTitle.trim(), displayPrompt);
    setShowSaveInput(false);
    setSaveTitle('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="prompt-output">
      <div className="prompt-output__header">
        <div className="prompt-output__title-wrap">
          <span className="pm-badge-success">Optimized Result</span>
          <h2 className="prompt-output__title">Generated Prompt</h2>
        </div>

        <div className="prompt-output__actions">
          <button
            className={pm-action-pill }
            onClick={handleCopy}
            type="button"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
          </button>

          <button
            className="pm-action-pill"
            onClick={handleEditToggle}
            type="button"
          >
            <Pencil size={14} />
            <span>{isEditing ? 'Done Editing' : 'Edit'}</span>
          </button>

          <button
            className="pm-action-pill pm-action-pill--save"
            onClick={() => setShowSaveInput(!showSaveInput)}
            type="button"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="prompt-output__card">
        {isEditing ? (
          <textarea
            className="prompt-output__editor"
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={8}
            autoFocus
          />
        ) : (
          <div className="prompt-output__text">{displayPrompt}</div>
        )}
      </div>

      {showSaveInput && (
        <div className="prompt-output__save-row">
          <input
            type="text"
            className="prompt-output__save-input"
            placeholder="Title for saved prompt (e.g. 'Scraper script prompt')..."
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          <button
            className="pm-btn-green"
            onClick={handleSave}
            type="button"
          >
            Confirm Save
          </button>
        </div>
      )}

      {savedSuccess && (
        <div className="pm-save-toast">
          <CheckCircle2 size={16} />
          <span>Prompt saved successfully!</span>
        </div>
      )}
    </div>
  );
}
