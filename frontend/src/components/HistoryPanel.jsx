import { useState, useEffect } from 'react';
import { Clock, Trash2, History } from 'lucide-react';
import { getHistory, deleteHistory } from '../api/promptmate';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const INTENT_EMOJI = {
  coding: '🔧',
  image_generation: '🎨',
  video_generation: '🎬',
  creative_writing: '✍️',
  data_analysis: '📊',
  general: '⚡',
};

export default function HistoryPanel({ onSelect, refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getHistory();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteHistory(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <aside className="history-panel">
      <div className="history-panel__header">
        <History size={18} />
        <h2>History</h2>
      </div>

      <div className="history-panel__list">
        {isLoading ? (
          <div className="history-panel__loading">Loading...</div>
        ) : items.length === 0 ? (
          <div className="history-panel__empty">No history yet</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="history-panel__item"
              onClick={() => onSelect(item)}
            >
              <div className="history-panel__item-top">
                <span className="history-panel__item-emoji">
                  {INTENT_EMOJI[item.detected_intent] || '⚡'}
                </span>
                <span className="history-panel__item-text">
                  {item.raw_input.length > 60
                    ? item.raw_input.slice(0, 60) + '...'
                    : item.raw_input}
                </span>
              </div>
              <div className="history-panel__item-bottom">
                <span className="history-panel__item-time">
                  <Clock size={12} />
                  {timeAgo(item.created_at)}
                </span>
                <button
                  className="history-panel__item-delete"
                  onClick={(e) => handleDelete(e, item.id)}
                  type="button"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
