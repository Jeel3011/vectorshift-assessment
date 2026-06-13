// BaseNode.js
// Core abstraction for all pipeline nodes.
// - Handle position computation pre-calculated (no O(N²) filter+indexOf per handle)
// - All field components memoized
// - NumberField NaN-guarded

import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';

const positionMap = {
  left:   Position.Left,
  right:  Position.Right,
  top:    Position.Top,
  bottom: Position.Bottom,
};

// Pre-compute each handle's top% before render, so the map body is O(1) per handle.
const computeHandlePositions = (handles) => {
  // Group by (type, position) — once, outside the render loop
  const groups = {};
  for (const h of handles) {
    const key = `${h.type}:${h.position}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(h);
  }
  return handles.map((h) => {
    const key = `${h.type}:${h.position}`;
    const group = groups[key];
    const index = group.indexOf(h);
    const total = group.length;
    return total > 1 ? ((index + 1) * 100) / (total + 1) : 50;
  });
};

export const BaseNode = memo(({
  id,
  title,
  icon: IconComponent,
  accentColor = '#0a0a0a',
  handles = [],
  children,
  style = {},
  className = '',
  minWidth = 240,
  minHeight,
}) => {
  const leftHandles  = useMemo(() => handles.filter((h) => h.position === 'left'),  [handles]);
  const rightHandles = useMemo(() => handles.filter((h) => h.position === 'right'), [handles]);
  const topPercents  = useMemo(() => computeHandlePositions(handles), [handles]);

  return (
    <div
      className={`base-node ${className}`}
      style={{
        minWidth:  `${minWidth}px`,
        minHeight: minHeight ? `${minHeight}px` : undefined,
        ...style,
      }}
    >
      {/* Header */}
      <div className="base-node-header">
        <div className="base-node-badge" style={{ background: accentColor }}>
          {typeof IconComponent === 'function' ? <IconComponent size={13} /> : IconComponent}
        </div>
        <span className="base-node-title">{title}</span>
      </div>

      {/* Handle label tags */}
      {(leftHandles.length > 0 || rightHandles.length > 0) && (
        <div className="handle-labels-row">
          <div className="handle-labels-left">
            {leftHandles.map((h) => (
              <span key={h.id} className="handle-tag handle-tag-in">
                <span className="handle-tag-dot" style={{ background: accentColor }} />
                {h.label || h.id}
              </span>
            ))}
          </div>
          <div className="handle-labels-right">
            {rightHandles.map((h) => (
              <span key={h.id} className="handle-tag handle-tag-out">
                {h.label || h.id}
                <span className="handle-tag-dot" style={{ background: accentColor }} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      {children && <div className="base-node-body nodrag">{children}</div>}

      {/* Handles — topPercent pre-computed above (O(N) total, not O(N²)) */}
      {handles.map((handle, idx) => (
        <Handle
          key={handle.id || `${handle.type}-${idx}`}
          type={handle.type}
          position={positionMap[handle.position] || Position.Left}
          id={`${id}-${handle.id || idx}`}
          className={`base-node-handle ${handle.type === 'source' ? 'handle-source' : 'handle-target'}`}
          style={{ top: `${topPercents[idx]}%`, ...(handle.style || {}) }}
        />
      ))}
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

// ─── Reusable Field Components ────────────────────────────────────────────────

export const TextField = memo(({ label, value, onChange, placeholder = '' }) => (
  <div className="base-node-field">
    <label className="base-node-label">{label}</label>
    <input
      className="base-node-input nodrag"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
));
TextField.displayName = 'TextField';

export const SelectField = memo(({ label, value, onChange, options = [] }) => (
  <div className="base-node-field">
    <label className="base-node-label">{label}</label>
    <select
      className="base-node-select nodrag"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => {
        const val     = typeof opt === 'string' ? opt : opt.value;
        const display = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{display}</option>;
      })}
    </select>
  </div>
));
SelectField.displayName = 'SelectField';

export const NumberField = memo(({ label, value, onChange, min, max, step = 1 }) => (
  <div className="base-node-field">
    <label className="base-node-label">{label}</label>
    <input
      className="base-node-input nodrag"
      type="number"
      value={value}
      onChange={(e) => {
        const n = Number(e.target.value);
        onChange(Number.isFinite(n) ? n : 0); // NaN guard
      }}
      min={min}
      max={max}
      step={step}
    />
  </div>
));
NumberField.displayName = 'NumberField';

export const TextAreaField = memo(({ label, value, onChange, placeholder = '', rows = 3 }) => (
  <div className="base-node-field">
    <label className="base-node-label">{label}</label>
    <textarea
      className="base-node-textarea nodrag"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  </div>
));
TextAreaField.displayName = 'TextAreaField';

export const RangeField = memo(({ label, value, onChange, min = 0, max = 1, step = 0.05 }) => (
  <div className="base-node-field">
    <label className="base-node-label">
      {label}: <span className="base-node-range-value">{value}</span>
    </label>
    <input
      className="base-node-range nodrag"
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
    />
  </div>
));
RangeField.displayName = 'RangeField';
