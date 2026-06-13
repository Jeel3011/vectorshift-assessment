// conditionalNode.js
import { memo } from 'react';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { ConditionalIcon } from '../icons';

export const ConditionalNode = memo(({ id, data }) => {
  const [condition, setCondition] = useNodeField(id, 'condition', data?.condition ?? '');
  const [operator, setOperator] = useNodeField(id, 'operator', data?.operator ?? 'equals');

  return (
    <BaseNode
      id={id}
      title="Conditional"
      icon={ConditionalIcon}
      accentColor="#f97316"
      handles={[
        { type: 'target', position: 'left',  id: 'input', label: 'Input' },
        { type: 'source', position: 'right', id: 'true',  label: 'True'  },
        { type: 'source', position: 'right', id: 'false', label: 'False' },
      ]}
    >
      <TextField
        label="Condition"
        value={condition}
        onChange={setCondition}
        placeholder="e.g. value > 10"
      />
      <SelectField
        label="Operator"
        value={operator}
        onChange={setOperator}
        options={[
          { value: 'equals',       label: 'Equals'       },
          { value: 'contains',     label: 'Contains'     },
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than',    label: 'Less Than'    },
        ]}
      />
    </BaseNode>
  );
});

ConditionalNode.displayName = 'ConditionalNode';
