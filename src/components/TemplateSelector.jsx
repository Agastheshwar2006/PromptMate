import React from 'react';
import { Code, Image, Video, PenTool, BarChart3, Layers } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Auto Detect', icon: Layers },
  { id: 'coding', label: 'Coding', icon: Code },
  { id: 'image_generation', label: 'Image', icon: Image },
  { id: 'video_generation', label: 'Video', icon: Video },
  { id: 'creative_writing', label: 'Writing', icon: PenTool },
  { id: 'data_analysis', label: 'Data', icon: BarChart3 },
];

export default function TemplateSelector({ selected, onSelect }) {
  return (
    <div className="pm-template-selector">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            className={`pm-pill ${isActive ? 'pm-pill-active' : ''}`}
            onClick={() => onSelect(cat.id)}
          >
            <Icon size={12} className="pm-pill-icon" />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
