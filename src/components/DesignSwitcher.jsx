import React from 'react';
import { Moon, Sun, Flame } from 'lucide-react';

export const DESIGNS = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    badge: 'Dark',
    icon: Moon,
    description: 'Sleek cyber slate with emerald accents',
  },
  {
    id: 'studio',
    name: 'Studio',
    badge: 'Light',
    icon: Sun,
    description: 'Refined editorial light with indigo accents',
  },
  {
    id: 'amber',
    name: 'Amber',
    badge: 'Retro',
    icon: Flame,
    description: 'Warm gold terminal & vintage console',
  },
];

export default function DesignSwitcher({ currentDesign, onSelectDesign }) {
  return (
    <div className="pm-design-switcher" role="radiogroup" aria-label="Theme Designs">
      {DESIGNS.map((design) => {
        const Icon = design.icon;
        const isActive = currentDesign === design.id;
        return (
          <button
            key={design.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`pm-design-btn ${isActive ? 'pm-design-btn-active' : ''}`}
            onClick={() => onSelectDesign(design.id)}
            title={`${design.name} Design (${design.description})`}
          >
            <Icon size={14} className="pm-design-icon" />
            <span className="pm-design-name">{design.name}</span>
          </button>
        );
      })}
    </div>
  );
}
