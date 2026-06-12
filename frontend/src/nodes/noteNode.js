// noteNode.js
import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode } from './BaseNode';
import { NoteIcon } from '../icons';

const NOTE_COLORS = {
  cream: { bg: '#FBF9F4', border: '#D9D3C5' },
  'blue-gray': { bg: '#F0F3F7', border: '#C5CDD9' },
  sage: { bg: '#F0F5F1', border: '#C2D4C5' },
  rose: { bg: '#F7F0F0', border: '#D9C5C5' },
};

export const NoteNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [content, setContent] = useState(data?.content || 'Add a note...');
  const [color, setColor] = useState(data?.color || 'cream');
  const colorConfig = NOTE_COLORS[color] || NOTE_COLORS.cream;

  const setContentField = (val) => { setContent(val); updateNodeField(id, 'content', val); };
  const setColorField = (val) => { setColor(val); updateNodeField(id, 'color', val); };

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
          onChange={(e) => setContentField(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          style={{ background: 'transparent' }}
        />
      </div>
      <div className="note-node-colors">
        {Object.entries(NOTE_COLORS).map(([key, val]) => (
          <button
            key={key}
            className={`note-node-color-btn ${color === key ? 'active' : ''}`}
            style={{ background: val.bg, borderColor: color === key ? '#0F131A' : val.border }}
            onClick={() => setColorField(key)}
            title={key}
          />
        ))}
      </div>
    </BaseNode>
  );
};
