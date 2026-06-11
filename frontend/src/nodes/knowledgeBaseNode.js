// knowledgeBaseNode.js
import { useState } from 'react';
import { BaseNode, TextField, NumberField, RangeField } from './BaseNode';
import { KnowledgeBaseIcon } from '../icons';

export const KnowledgeBaseNode = ({ id, data }) => {
  const [query, setQuery] = useState(data?.query || '');
  const [topK, setTopK] = useState(data?.topK || 5);
  const [threshold, setThreshold] = useState(data?.threshold || 0.7);

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
      <TextField label="Query" value={query} onChange={setQuery} placeholder="Search query..." />
      <NumberField label="Top K" value={topK} onChange={setTopK} min={1} max={20} />
      <RangeField label="Threshold" value={threshold} onChange={setThreshold} min={0} max={1} step={0.05} />
    </BaseNode>
  );
};
