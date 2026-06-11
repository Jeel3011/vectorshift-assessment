// draggableNode.js

export const DraggableNode = ({ type, label, icon: IconComponent, accentColor }) => {
  const onDragStart = (event, nodeType) => {
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="draggable-node"
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => (event.target.style.cursor = 'grab')}
      draggable
    >
      {IconComponent && (
        <span className="draggable-node-icon-wrap">
          <IconComponent size={11} />
        </span>
      )}
      <span className="draggable-node-label">{label}</span>
    </div>
  );
};
