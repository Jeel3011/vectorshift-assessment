import { memo } from 'react';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { OutputIcon } from '../icons';

export const OutputNode = memo(({ id, data }) => {
  const defaultName = id.replace('customOutput-', 'output_');
  const [currName, setCurrName] = useNodeField(id, 'outputName', data?.outputName ?? defaultName);
  const [outputType, setOutputType] = useNodeField(id, 'outputType', data?.outputType ?? 'Text');

  return (
    <BaseNode
      id={id}
      title="Output"
      icon={OutputIcon}
      accentColor="#f59e0b"
      handles={[{ type: 'target', position: 'left', id: 'value', label: 'Value' }]}
    >
      <TextField label="Name" value={currName} onChange={setCurrName} placeholder="output_name" />
      <SelectField label="Type" value={outputType} onChange={setOutputType} options={['Text', 'Image']} />
    </BaseNode>
  );
});

OutputNode.displayName = 'OutputNode';
