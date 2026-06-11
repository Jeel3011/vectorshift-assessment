// BaseNode.js
// Core abstraction for all pipeline nodes.

import { Handle, Position } from 'reactflow';

const positionMap = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

export const BaseNode = ({
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
  const leftHandles = handles.filter(h => h.position === 'left');
  const rightHandles = handles.filter(h => h.position === 'right');

  return (
    <div
      className={`base-node ${className}`}
      style={{
        minWidth: `${minWidth}px`,
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
            {leftHandles.map(h => (
              <span key={h.id} className="handle-tag handle-tag-in">
                <span className="handle-tag-dot" style={{ background: accentColor }} />
                {h.label || h.id}
              </span>
            ))}
          </div>
          <div className="handle-labels-right">
            {rightHandles.map(h => (
              <span key={h.id} className="handle-tag handle-tag-out">
                {h.label || h.id}
                <span className="handle-tag-dot" style={{ background: accentColor }} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Body — wrapped in nodrag/nowheel to prevent ReactFlow from capturing events */}
      {children && <div className="base-node-body nodrag">{children}</div>}

      {/* Handles */}
      {handles.map((handle, idx) => {
        const sameSide = handles.filter(
          (h) => h.type === handle.type && h.position === handle.position
        );
        const total = sameSide.length;
        const index = sameSide.indexOf(handle);
        const topPercent = total > 1
          ? ((index + 1) * 100) / (total + 1)
          : 50;

        return (
          <Handle
            key={handle.id || `${handle.type}-${idx}`}
            type={handle.type}
            position={positionMap[handle.position] || Position.Left}
            id={`${id}-${handle.id || idx}`}
            className={`base-node-handle ${handle.type === 'source' ? 'handle-source' : 'handle-target'}`}
            style={{ top: `${topPercent}%`, ...(handle.style || {}) }}
          />
        );
      })}
    </div>
  );
};

// ─── Reusable Field Components ────────────────────────────
// All inputs have className "nodrag" so ReactFlow won't intercept clicks/drags on them

export const TextField = ({ label, value, onChange, placeholder = '' }) => (
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
);

export const SelectField = ({ label, value, onChange, options = [] }) => (
  <div className="base-node-field">
    <label className="base-node-label">{label}</label>
    <select
      className="base-node-select nodrag"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const display = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{display}</option>;
      })}
    </select>
  </div>
);

export const NumberField = ({ label, value, onChange, min, max, step = 1 }) => (
  <div className="base-node-field">
    <label className="base-node-label">{label}</label>
    <input
      className="base-node-input nodrag"
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
    />
  </div>
);

export const TextAreaField = ({ label, value, onChange, placeholder = '', rows = 3 }) => (
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
);

export const RangeField = ({ label, value, onChange, min = 0, max = 1, step = 0.05 }) => (
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
);
