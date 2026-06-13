// textNode.js
// Dynamic resize + {{ variable }} handle detection.
// - Dual-state anti-pattern removed: text lives in Zustand store only.
// - Width measurement debounced by 150ms to avoid per-keystroke canvas calls.
// - measureTextWidth canvas context is module-scoped (created once, never GC'd intentionally).

import { useState, useMemo, useCallback, memo } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { TextIcon } from '../icons';

// ── Variable extraction ────────────────────────────────────────────────────
// Only allow safe identifier chars: start with letter/_, then alphanumeric/_.
// Deliberately excludes JS reserved words like __proto__, constructor, etc.
const VAR_REGEX = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]{0,62})\s*\}\}/g;

const extractVariables = (text) => {
  const vars = [];
  let match;
  VAR_REGEX.lastIndex = 0;
  while ((match = VAR_REGEX.exec(text)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1]);
  }
  return vars;
};

// ── Text-width measurement (single canvas, module-scoped) ──────────────────
let _measureCtx = null;
const measureTextWidth = (text, font) => {
  if (!_measureCtx) {
    const canvas = document.createElement('canvas');
    _measureCtx = canvas.getContext('2d');
  }
  _measureCtx.font = font;
  const lines = text.split('\n');
  return Math.max(...lines.map((l) => _measureCtx.measureText(l).width));
};

// ── Debounce utility (no external dependency needed) ──────────────────────
const useDebounced = (fn, delay) => {
  const timerRef = { current: null };
  return useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay]
  );
};

const FONT = '12.5px Inter, sans-serif';
const MIN_WIDTH = 240;
const MAX_WIDTH = 440;

export const TextNode = memo(({ id, data }) => {
  const [currText, setCurrText] = useNodeField(id, 'text', data?.text ?? '{{input}}');
  const [, setVariables]        = useNodeField(id, 'variables', data?.variables ?? []);
  const [width, setWidth]       = useState(MIN_WIDTH);

  const variables = useMemo(() => extractVariables(currText), [currText]);

  const updateWidth = useCallback((val) => {
    const textWidth = measureTextWidth(val || ' ', FONT);
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(textWidth) + 56)));
  }, []);

  const debouncedUpdateWidth = useDebounced(updateWidth, 150);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setCurrText(val);
    setVariables(extractVariables(val));

    // Immediate auto-height (layout-driven, cheap)
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(280, Math.max(52, ta.scrollHeight))}px`;

    // Debounced auto-width (canvas measurement, deferred)
    debouncedUpdateWidth(val);
  }, [setCurrText, setVariables, debouncedUpdateWidth]);

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
          style={{ top: `${((idx + 1) * 100) / (variables.length + 1)}%` }}
        />
      ))}
    </BaseNode>
  );
});

TextNode.displayName = 'TextNode';
