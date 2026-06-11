// conditionalNode.js
import { useState } from 'react';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { ConditionalIcon } from '../icons';

export const ConditionalNode = ({ id, data }) => {
  const [condition, setCondition] = useState(data?.condition || '');
  const [operator, setOperator] = useState(data?.operator || 'equals');

  return (
    <BaseNode
      id={id}
      title="Conditional"
      icon={ConditionalIcon}
      accentColor="#f97316"
      handles={[
        { type: 'target', position: 'left', id: 'input', label: 'Input' },
        { type: 'source', position: 'right', id: 'true', label: 'True' },
        { type: 'source', position: 'right', id: 'false', label: 'False' },
      ]}
    >
      <TextField label="Condition" value={condition} onChange={setCondition} placeholder="e.g. value > 10" />
      <SelectField
        label="Operator"
        value={operator}
        onChange={setOperator}
        options={[
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than', label: 'Less Than' },
        ]}
      />
    </BaseNode>
  );
};
