// outputNode.js

import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { OutputIcon } from '../icons';

export const OutputNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [currName, setCurrName] = useState(
    data?.outputName || id.replace('customOutput-', 'output_')
  );
  const [outputType, setOutputType] = useState(data?.outputType || 'Text');

  const setName = (val) => { setCurrName(val); updateNodeField(id, 'outputName', val); };
  const setType = (val) => { setOutputType(val); updateNodeField(id, 'outputType', val); };

  return (
    <BaseNode
      id={id}
      title="Output"
      icon={OutputIcon}
      accentColor="#f59e0b"
      handles={[{ type: 'target', position: 'left', id: 'value', label: 'Value' }]}
    >
      <TextField label="Name" value={currName} onChange={setName} placeholder="output_name" />
      <SelectField label="Type" value={outputType} onChange={setType} options={['Text', 'Image']} />
    </BaseNode>
  );
};
