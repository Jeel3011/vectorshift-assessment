// apiCallNode.js
// HTTP API request node — demonstrates TextField composition

import { useState } from 'react';
import { BaseNode, TextField, SelectField, TextAreaField } from './BaseNode';

const ApiIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const ApiCallNode = ({ id, data }) => {
  const [url, setUrl] = useState(data?.url || '');
  const [method, setMethod] = useState(data?.method || 'GET');
  const [headers, setHeaders] = useState(data?.headers || '');

  return (
    <BaseNode
      id={id}
      title="API Call"
      icon={ApiIcon}
      accentColor="#ef4444"
      handles={[
        { type: 'target', position: 'left', id: 'body', label: 'Body' },
        { type: 'source', position: 'right', id: 'response', label: 'Response' },
      ]}
    >
      <SelectField
        label="Method"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
        ]}
      />
      <TextField label="URL" value={url} onChange={setUrl} placeholder="https://api.example.com/data" />
      <TextAreaField label="Headers" value={headers} onChange={setHeaders} placeholder='{"Authorization": "Bearer ..."}' rows={2} />
    </BaseNode>
  );
};
