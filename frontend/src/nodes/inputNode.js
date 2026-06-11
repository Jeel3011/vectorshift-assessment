// inputNode.js

import { useState } from 'react';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { InputIcon } from '../icons';

export const InputNode = ({ id, data }) => {
  const [currName, setCurrName] = useState(
    data?.inputName || id.replace('customInput-', 'input_')
  );
  const [inputType, setInputType] = useState(data?.inputType || 'Text');

  return (
    <BaseNode
      id={id}
      title="Input"
      icon={InputIcon}
      accentColor="#22c55e"
      handles={[{ type: 'source', position: 'right', id: 'value', label: 'Value' }]}
    >
      <TextField label="Name" value={currName} onChange={setCurrName} placeholder="input_name" />
      <SelectField
        label="Type"
        value={inputType}
        onChange={setInputType}
        options={['Text', 'File']}
      />
    </BaseNode>
  );
};
