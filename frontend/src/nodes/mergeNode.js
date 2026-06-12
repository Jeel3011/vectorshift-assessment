// mergeNode.js
import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode, SelectField } from './BaseNode';
import { MergeIcon } from '../icons';

export const MergeNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [strategy, setStrategy] = useState(data?.strategy || 'concatenate');

  const setStrategyField = (val) => { setStrategy(val); updateNodeField(id, 'strategy', val); };

  return (
    <BaseNode
      id={id}
      title="Merge"
      icon={MergeIcon}
      accentColor="#6366f1"
      handles={[
        { type: 'target', position: 'left', id: 'input_1', label: 'Input 1' },
        { type: 'target', position: 'left', id: 'input_2', label: 'Input 2' },
        { type: 'source', position: 'right', id: 'output', label: 'Output' },
      ]}
    >
      <SelectField
        label="Strategy"
        value={strategy}
        onChange={setStrategyField}
        options={[
          { value: 'concatenate', label: 'Concatenate' },
          { value: 'pick_first', label: 'Pick First' },
          { value: 'join_all', label: 'Join All' },
        ]}
      />
    </BaseNode>
  );
};
