// mergeNode.js
import { useState } from 'react';
import { BaseNode, SelectField } from './BaseNode';
import { MergeIcon } from '../icons';

export const MergeNode = ({ id, data }) => {
  const [strategy, setStrategy] = useState(data?.strategy || 'concatenate');

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
        onChange={setStrategy}
        options={[
          { value: 'concatenate', label: 'Concatenate' },
          { value: 'pick_first', label: 'Pick First' },
          { value: 'join_all', label: 'Join All' },
        ]}
      />
    </BaseNode>
  );
};
