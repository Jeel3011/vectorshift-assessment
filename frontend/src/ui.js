import { useState, useRef, useCallback, Component } from 'react';
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

// Declared at module scope — never changes, so ReactFlow never remounts nodes
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

// Prevent self-loops at the connection UI level
const isValidConnection = (connection) => connection.source !== connection.target;

// ── Error Boundary ─────────────────────────────────────────────────────────
// Catches render errors in any node component; shows a recoverable fallback
// instead of a blank white screen.

class CanvasErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Replace with Sentry.captureException(error, { extra: info }) in production
    console.error('[CanvasErrorBoundary]', error, info);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="canvas-error-state">
          <div className="canvas-error-icon">⚠</div>
          <div className="canvas-error-title">The canvas encountered an error</div>
          <div className="canvas-error-sub">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </div>
          <button className="canvas-error-btn" onClick={this.handleReset}>
            Reload canvas
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Selector — stable reference via useShallow ─────────────────────────────
const selector = (state) => ({
  nodesMap: state.nodesMap,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const {
    nodesMap, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect,
  } = useStore(useShallow(selector));

  // Derive flat nodes array for ReactFlow — stable as long as nodesMap ref is stable
  const nodes = Object.values(nodesMap);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event?.dataTransfer?.getData('application/reactflow');
      if (!raw) return;

      let appData;
      try {
        appData = JSON.parse(raw);
      } catch {
        return;
      }
      const type = appData?.nodeType;
      if (!type || !nodeTypes[type]) return; // reject unknown node types

      const position = reactFlowInstance?.screenToFlowPosition
        ? reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
        : (() => {
            const bounds = reactFlowWrapper.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
            return reactFlowInstance?.project({
              x: event.clientX - bounds.left,
              y: event.clientY - bounds.top,
            }) ?? { x: event.clientX, y: event.clientY };
          })();

      const nodeID = getNodeID(type);
      addNode({ id: nodeID, type, position, data: { id: nodeID, nodeType: type } });
    },
    [reactFlowInstance, addNode, getNodeID]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={reactFlowWrapper} className="reactflow-wrapper">
      <CanvasErrorBoundary>
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
      </CanvasErrorBoundary>

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
