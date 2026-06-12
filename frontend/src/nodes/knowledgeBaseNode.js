// knowledgeBaseNode.js
import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode, TextField, NumberField, RangeField } from './BaseNode';
import { KnowledgeBaseIcon } from '../icons';

export const KnowledgeBaseNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [query, setQuery] = useState(data?.query || '');
  const [topK, setTopK] = useState(data?.topK || 5);
  const [threshold, setThreshold] = useState(data?.threshold || 0.7);

  const setQueryField = (val) => { setQuery(val); updateNodeField(id, 'query', val); };
  const setTopKField = (val) => { setTopK(val); updateNodeField(id, 'topK', val); };
  const setThresholdField = (val) => { setThreshold(val); updateNodeField(id, 'threshold', val); };

  return (
    <BaseNode
      id={id}
      title="Knowledge Base"
      icon={KnowledgeBaseIcon}
      accentColor="#ec4899"
      handles={[
        { type: 'target', position: 'left', id: 'query', label: 'Query' },
        { type: 'source', position: 'right', id: 'results', label: 'Results' },
      ]}
    >
      <TextField label="Query" value={query} onChange={setQueryField} placeholder="Search query..." />
      <NumberField label="Top K" value={topK} onChange={setTopKField} min={1} max={20} />
      <RangeField label="Threshold" value={threshold} onChange={setThresholdField} min={0} max={1} step={0.05} />
    </BaseNode>
  );
};
