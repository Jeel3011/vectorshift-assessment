import { memo } from 'react';

export const DraggableNode = memo(({ type, label, icon: IconComponent, accentColor }) => {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType: type }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="draggable-node"
      onDragStart={onDragStart}
      draggable
      role="button"
      aria-label={`Add ${label} node`}
      tabIndex={0}
    >
      {IconComponent && (
        <span className="draggable-node-icon-wrap">
          <IconComponent size={11} />
        </span>
      )}
      <span className="draggable-node-label">{label}</span>
    </div>
  );
});

DraggableNode.displayName = 'DraggableNode';
