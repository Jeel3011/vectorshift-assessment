import { memo } from 'react';
import { BaseNode, SelectField } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { LLMIcon } from '../icons';

const MODEL_OPTIONS = [
  { value: 'gpt-4o',         label: 'GPT-4o' },
  { value: 'gpt-4o-mini',    label: 'GPT-4o Mini' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'gemini-pro',     label: 'Gemini Pro' },
];

export const LLMNode = memo(({ id, data }) => {
  const [model, setModel] = useNodeField(id, 'model', data?.model ?? 'gpt-4o');

  return (
    <BaseNode
      id={id}
      title="LLM"
      icon={LLMIcon}
      accentColor="#8b5cf6"
      handles={[
        { type: 'target', position: 'left',  id: 'system',   label: 'System' },
        { type: 'target', position: 'left',  id: 'prompt',   label: 'Prompt' },
        { type: 'source', position: 'right', id: 'response', label: 'Response' },
      ]}
    >
      <SelectField label="Model" value={model} onChange={setModel} options={MODEL_OPTIONS} />
      <div className="llm-node-info">
        Generates text from a system prompt and user prompt using the selected model.
      </div>
      <div className="llm-node-model-tag">
        <span className="llm-model-dot" />
        {MODEL_OPTIONS.find((o) => o.value === model)?.label ?? model}
      </div>
    </BaseNode>
  );
});

LLMNode.displayName = 'LLMNode';
