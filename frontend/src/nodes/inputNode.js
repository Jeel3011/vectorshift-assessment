import { memo } from 'react';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { InputIcon } from '../icons';

export const InputNode = memo(({ id, data }) => {
  const defaultName = id.replace('customInput-', 'input_');
  const [currName, setCurrName] = useNodeField(id, 'inputName', data?.inputName ?? defaultName);
  const [inputType, setInputType] = useNodeField(id, 'inputType', data?.inputType ?? 'Text');

  return (
    <BaseNode
      id={id}
      title="Input"
      icon={InputIcon}
      accentColor="#22c55e"
      handles={[{ type: 'source', position: 'right', id: 'value', label: 'Value' }]}
    >
      <TextField label="Name" value={currName} onChange={setCurrName} placeholder="input_name" />
      <SelectField label="Type" value={inputType} onChange={setInputType} options={['Text', 'File']} />
    </BaseNode>
  );
});

InputNode.displayName = 'InputNode';
