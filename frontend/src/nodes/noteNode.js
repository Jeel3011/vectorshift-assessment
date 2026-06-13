// noteNode.js
import { memo } from 'react';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { NoteIcon } from '../icons';

const NOTE_COLORS = {
  cream:     { bg: '#FBF9F4', border: '#D9D3C5' },
  'blue-gray': { bg: '#F0F3F7', border: '#C5CDD9' },
  sage:      { bg: '#F0F5F1', border: '#C2D4C5' },
  rose:      { bg: '#F7F0F0', border: '#D9C5C5' },
};

const NOTE_MAX_LENGTH = 2000;

export const NoteNode = memo(({ id, data }) => {
  const [content, setContent] = useNodeField(id, 'content', data?.content ?? 'Add a note...');
  const [color,   setColor]   = useNodeField(id, 'color',   data?.color   ?? 'cream');

  const colorConfig = NOTE_COLORS[color] ?? NOTE_COLORS.cream;

  const handleContentChange = (e) => {
    const val = e.target.value.slice(0, NOTE_MAX_LENGTH);
    setContent(val);
  };

  return (
    <BaseNode
      id={id}
      title="Note"
      icon={NoteIcon}
      accentColor="#eab308"
      handles={[]}
      className="note-node"
      style={{ background: colorConfig.bg, borderColor: colorConfig.border }}
    >
      <div className="base-node-field">
        <textarea
          className="base-node-textarea nodrag"
          value={content}
          onChange={handleContentChange}
          placeholder="Write a note..."
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          style={{ background: 'transparent' }}
        />
      </div>
      <div className="note-node-colors">
        {Object.entries(NOTE_COLORS).map(([key, val]) => (
          <button
            key={key}
            className={`note-node-color-btn ${color === key ? 'active' : ''}`}
            style={{ background: val.bg, borderColor: color === key ? '#0F131A' : val.border }}
            onClick={() => setColor(key)}
            title={key}
          />
        ))}
      </div>
    </BaseNode>
  );
});

NoteNode.displayName = 'NoteNode';
