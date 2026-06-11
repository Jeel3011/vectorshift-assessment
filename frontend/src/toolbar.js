// toolbar.js

import { DraggableNode } from './draggableNode';
import {
  InputIcon, OutputIcon, TextIcon, LLMIcon,
  KnowledgeBaseIcon, ConditionalIcon, MergeIcon,
  DataTransformIcon, NoteIcon,
} from './icons';

const ApiIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TimerIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ChatIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// accent color per node type — must match the node file accentColor
const NODE_GROUPS = [
  {
    label: 'General',
    nodes: [
      { type: 'customInput', label: 'Input',  icon: InputIcon,  color: '#22c55e' },
      { type: 'customOutput', label: 'Output', icon: OutputIcon, color: '#f59e0b' },
      { type: 'text',         label: 'Text',   icon: TextIcon,   color: '#0ea5e9' },
    ],
  },
  {
    label: 'AI',
    nodes: [
      { type: 'llm',           label: 'LLM',            icon: LLMIcon,          color: '#8b5cf6' },
      { type: 'knowledgeBase', label: 'Knowledge Base', icon: KnowledgeBaseIcon, color: '#ec4899' },
      { type: 'chat',          label: 'Chat',           icon: ChatIcon,          color: '#06b6d4' },
    ],
  },
  {
    label: 'Logic',
    nodes: [
      { type: 'conditional',  label: 'Conditional', icon: ConditionalIcon,   color: '#f97316' },
      { type: 'merge',        label: 'Merge',       icon: MergeIcon,         color: '#6366f1' },
      { type: 'dataTransform',label: 'Transform',   icon: DataTransformIcon, color: '#14b8a6' },
    ],
  },
  {
    label: 'Integration',
    nodes: [
      { type: 'apiCall', label: 'API Call', icon: ApiIcon,   color: '#ef4444' },
      { type: 'timer',   label: 'Timer',   icon: TimerIcon, color: '#a855f7' },
    ],
  },
  {
    label: 'Utility',
    nodes: [
      { type: 'note', label: 'Note', icon: NoteIcon, color: '#eab308' },
    ],
  },
];

export const PipelineToolbar = () => (
  <div className="pipeline-toolbar">
    <div className="toolbar-header">
      <div className="toolbar-logo">
        <span className="toolbar-logo-mark">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </span>
        Pipeline Builder
      </div>
      <span className="toolbar-subtitle">Drag nodes to canvas</span>
    </div>
    <div className="toolbar-nodes">
      {NODE_GROUPS.map((group, gi) => (
        <div key={group.label} className="toolbar-group">
          {gi > 0 && <div className="toolbar-divider" />}
          <span className="toolbar-section-label">{group.label}</span>
          {group.nodes.map((n) => (
            <DraggableNode
              key={n.type}
              type={n.type}
              label={n.label}
              icon={n.icon}
              accentColor={n.color}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);
