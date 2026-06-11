// outputNode.js

import { useState } from 'react';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { OutputIcon } from '../icons';

export const OutputNode = ({ id, data }) => {
  const [currName, setCurrName] = useState(
    data?.outputName || id.replace('customOutput-', 'output_')
  );
  const [outputType, setOutputType] = useState(data?.outputType || 'Text');

  return (
    <BaseNode
      id={id}
      title="Output"
      icon={OutputIcon}
      accentColor="#f59e0b"
      handles={[{ type: 'target', position: 'left', id: 'value', label: 'Value' }]}
    >
      <TextField label="Name" value={currName} onChange={setCurrName} placeholder="output_name" />
      <SelectField
        label="Type"
        value={outputType}
        onChange={setOutputType}
        options={['Text', 'Image']}
      />
    </BaseNode>
  );
};
