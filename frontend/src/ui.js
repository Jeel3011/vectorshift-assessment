// ui.js
import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap, MarkerType } from 'reactflow';
import { useStore } from './store';
import { useShallow } from 'zustand/react/shallow';

import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { KnowledgeBaseNode } from './nodes/knowledgeBaseNode';
import { ConditionalNode } from './nodes/conditionalNode';
import { MergeNode } from './nodes/mergeNode';
import { DataTransformNode } from './nodes/dataTransformNode';
import { NoteNode } from './nodes/noteNode';
import { ApiCallNode } from './nodes/apiCallNode';
import { TimerNode } from './nodes/timerNode';
import { ChatNode } from './nodes/chatNode';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };

const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  knowledgeBase: KnowledgeBaseNode,
  conditional: ConditionalNode,
  merge: MergeNode,
  dataTransform: DataTransformNode,
  note: NoteNode,
  apiCall: ApiCallNode,
  timer: TimerNode,
  chat: ChatNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

// Prevent self-loops at the UI level (belt-and-suspenders on top of store guard)
const isValidConnection = (connection) => connection.source !== connection.target;

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const {
    nodes, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect,
  } = useStore(useShallow(selector));

  const getInitNodeData = (nodeID, type) => ({ id: nodeID, nodeType: `${type}` });

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!event?.dataTransfer?.getData('application/reactflow')) return;

      const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      const type = appData?.nodeType;
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition
        ? reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
        : reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
          });

      const nodeID = getNodeID(type);
      addNode({ id: nodeID, type, position, data: getInitNodeData(nodeID, type) });
    },
    [reactFlowInstance, addNode, getNodeID]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} className="reactflow-wrapper">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        snapToGrid
        connectionLineType="smoothstep"
        isValidConnection={isValidConnection}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: '#94a3b8' },
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
      >
        <Background color="#e4e4e7" gap={gridSize} size={1} variant="dots" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeColor="#e4e4e7"
          nodeColor="#ffffff"
          nodeBorderRadius={8}
          maskColor="rgba(250,250,250,0.85)"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="empty-state-hint">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M17.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0" />
              <path d="M10 6.5h4M6.5 10v4M17.5 10v4.5" />
            </svg>
          </div>
          <div className="empty-state-title">Drag nodes to build your pipeline</div>
          <div className="empty-state-sub">
            Pick a node from the toolbar above · Connect handles to wire data flow
            <br />
            <span className="empty-state-key">Backspace</span> or <span className="empty-state-key">Delete</span> removes selected items
          </div>
        </div>
      )}
    </div>
  );
};
