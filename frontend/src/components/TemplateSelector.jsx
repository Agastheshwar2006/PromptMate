const CATEGORIES = [
  { key: null, label: 'All Categories' },
  { key: 'coding', label: 'Coding' },
  { key: 'image_generation', label: 'Image Gen' },
  { key: 'video_generation', label: 'Video Gen' },
  { key: 'creative_writing', label: 'Writing' },
  { key: 'data_analysis', label: 'Data Analysis' },
  { key: 'general', label: 'General' },
];

export default function TemplateSelector({ selected, onSelect }) {
  return (
    <div className="template-selector">
      <div className="template-selector__pills">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={label}
            className={	emplate-selector__pill }
            onClick={() => onSelect(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
