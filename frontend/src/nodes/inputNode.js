// inputNode.js

import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode, TextField, SelectField } from './BaseNode';
import { InputIcon } from '../icons';

export const InputNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [currName, setCurrName] = useState(
    data?.inputName || id.replace('customInput-', 'input_')
  );
  const [inputType, setInputType] = useState(data?.inputType || 'Text');

  const setName = (val) => { setCurrName(val); updateNodeField(id, 'inputName', val); };
  const setType = (val) => { setInputType(val); updateNodeField(id, 'inputType', val); };

  return (
    <BaseNode
      id={id}
      title="Input"
      icon={InputIcon}
      accentColor="#22c55e"
      handles={[{ type: 'source', position: 'right', id: 'value', label: 'Value' }]}
    >
      <TextField label="Name" value={currName} onChange={setName} placeholder="input_name" />
      <SelectField label="Type" value={inputType} onChange={setType} options={['Text', 'File']} />
    </BaseNode>
  );
};
