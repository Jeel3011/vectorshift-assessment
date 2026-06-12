// llmNode.js

import { BaseNode } from './BaseNode';
import { LLMIcon } from '../icons';

export const LLMNode = ({ id, data }) => {
  return (
    <BaseNode
      id={id}
      title="LLM"
      icon={LLMIcon}
      accentColor="#8b5cf6"
      handles={[
        { type: 'target', position: 'left', id: 'system', label: 'System' },
        { type: 'target', position: 'left', id: 'prompt', label: 'Prompt' },
        { type: 'source', position: 'right', id: 'response', label: 'Response' },
      ]}
    >
      <div className="llm-node-info">
        Uses a large language model to generate text from a system prompt and user prompt.
      </div>
      <div className="llm-node-model-tag">
        <span className="llm-model-dot" />
        GPT-4o
      </div>
    </BaseNode>
  );
};
