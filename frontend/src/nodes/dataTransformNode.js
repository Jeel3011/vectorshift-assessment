// dataTransformNode.js
import { useState } from 'react';
import { BaseNode, SelectField, TextAreaField } from './BaseNode';
import { DataTransformIcon } from '../icons';

export const DataTransformNode = ({ id, data }) => {
  const [transformType, setTransformType] = useState(data?.transformType || 'to_json');
  const [template, setTemplate] = useState(data?.template || '');

  return (
    <BaseNode
      id={id}
      title="Data Transform"
      icon={DataTransformIcon}
      accentColor="#14b8a6"
      handles={[
        { type: 'target', position: 'left', id: 'input', label: 'Data' },
        { type: 'source', position: 'right', id: 'output', label: 'Result' },
      ]}
    >
      <SelectField
        label="Transform"
        value={transformType}
        onChange={setTransformType}
        options={[
          { value: 'to_json', label: 'To JSON' },
          { value: 'to_text', label: 'To Text' },
          { value: 'to_number', label: 'To Number' },
          { value: 'to_base64', label: 'To Base64' },
        ]}
      />
      <TextAreaField
        label="Template"
        value={template}
        onChange={setTemplate}
        placeholder="Optional template..."
        rows={2}
      />
    </BaseNode>
  );
};
