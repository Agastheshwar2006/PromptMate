import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Bookmark,
  Clock,
  Search,
  FolderOpen,
} from 'lucide-react';
import {
  getHistory,
  getSavedPrompts,
  deleteHistoryItem,
  deleteSavedItem,
} from '../api/promptmate';

export default function HistoryPanel({
  isOpen,
  onClose,
  onSelectPrompt,
  refreshTrigger,
}) {
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' | 'saved'
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadItems();
  }, [isOpen, activeTab, refreshTrigger]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'recent') {
        const data = await getHistory();
        setItems(Array.isArray(data) ? data : []);
      } else {
        const data = await getSavedPrompts();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load history items:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      if (activeTab === 'recent') {
        await deleteHistoryItem(id);
      } else {
        await deleteSavedItem(id);
      }
      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.raw_input && item.raw_input.toLowerCase().includes(q)) ||
      (item.generated_prompt && item.generated_prompt.toLowerCase().includes(q)) ||
      (item.detected_intent && item.detected_intent.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="pm-modal-backdrop" onClick={onClose}>
      <div className="pm-sidebar-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pm-sidebar-header">
          <div className="pm-sidebar-title-group">
            <FolderOpen size={18} />
            <h2>Library & History</h2>
          </div>
          <button
            type="button"
            className="pm-btn pm-btn-icon"
            onClick={onClose}
            aria-label="Close library"
          >
            <X size={18} />
          </button>
        </div>

        <div className="pm-sidebar-tabs">
          <button
            type="button"
            className={`pm-subtab-btn ${activeTab === 'recent' ? 'pm-subtab-btn-active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <Clock size={14} />
            <span>Recent Generations</span>
          </button>
          <button
            type="button"
            className={`pm-subtab-btn ${activeTab === 'saved' ? 'pm-subtab-btn-active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={14} />
            <span>Saved Prompts</span>
          </button>
        </div>

        <div className="pm-search-box">
          <Search size={14} className="pm-search-icon" />
          <input
            type="text"
            className="pm-search-input"
            placeholder="Search prompts or inputs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="pm-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="pm-items-list">
          {isLoading ? (
            <div className="pm-empty-state">Loading library...</div>
          ) : filteredItems.length === 0 ? (
            <div className="pm-empty-state">
              {searchQuery ? 'No matching prompts found.' : 'No prompt records yet.'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="pm-history-card"
                onClick={() => onSelectPrompt(item)}
              >
                <div className="pm-history-card-header">
                  <span className="pm-badge pm-badge-sm">
                    {item.detected_intent || 'general'}
                  </span>
                  <span className="pm-history-date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                  <button
                    type="button"
                    className="pm-del-btn"
                    onClick={(e) => handleDelete(e, item.id)}
                    title="Delete record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="pm-history-raw">{item.raw_input}</div>
                <div className="pm-history-preview">
                  {item.generated_prompt?.slice(0, 110)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
