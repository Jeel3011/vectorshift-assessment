// textNode.js
// Dynamic resize + {{ variable }} handle detection.

import { useState, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { BaseNode } from './BaseNode';
import { TextIcon } from '../icons';

const extractVariables = (text) => {
  const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
  const vars = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1]);
  }
  return vars;
};

// Measure the pixel width of the longest line using a canvas context (no DOM reflow)
const measureTextWidth = (() => {
  let ctx = null;
  return (text, font) => {
    if (!ctx) {
      const canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
    }
    ctx.font = font;
    const lines = text.split('\n');
    return Math.max(...lines.map((l) => ctx.measureText(l).width));
  };
})();

export const TextNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  const [width, setWidth] = useState(240);

  const variables = useMemo(() => extractVariables(currText), [currText]);

  const handleChange = (e) => {
    const val = e.target.value;
    setCurrText(val);
    updateNodeField(id, 'text', val);
    updateNodeField(id, 'variables', extractVariables(val));

    // Auto-height: reset then let scrollHeight expand
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(280, Math.max(52, ta.scrollHeight))}px`;

    // Auto-width based on actual text measurement
    const textWidth = measureTextWidth(val || ' ', '12.5px Inter, sans-serif');
    const padded = Math.ceil(textWidth) + 56;
    setWidth(Math.min(440, Math.max(240, padded)));
  };

  return (
    <BaseNode
      id={id}
      title="Text"
      icon={TextIcon}
      accentColor="#0ea5e9"
      handles={[
        { type: 'source', position: 'right', id: 'output', label: 'Output' },
      ]}
      minWidth={width}
    >
      <div className="base-node-field">
        <label className="base-node-label">Text</label>
        <textarea
          className="text-node-textarea nodrag"
          value={currText}
          onChange={handleChange}
          placeholder="Enter text or use {{ variable }}…"
          rows={2}
        />
      </div>

      {variables.length > 0 && (
        <div className="text-node-vars">
          {variables.map((v) => (
            <span key={v} className="text-node-var-pill">
              <span className="text-node-var-dot" />
              {v}
            </span>
          ))}
        </div>
      )}

      {variables.map((varName, idx) => (
        <Handle
          key={`var-${varName}`}
          type="target"
          position={Position.Left}
          id={`${id}-${varName}`}
          className="base-node-handle handle-target"
          style={{
            top: `${((idx + 1) * 100) / (variables.length + 1)}%`,
          }}
        />
      ))}
    </BaseNode>
  );
};
