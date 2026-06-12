// apiCallNode.js
// HTTP API request node — demonstrates TextField composition

import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode, TextField, SelectField, TextAreaField } from './BaseNode';
import { ApiIcon } from '../icons';

export const ApiCallNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [url, setUrl] = useState(data?.url || '');
  const [method, setMethod] = useState(data?.method || 'GET');
  const [headers, setHeaders] = useState(data?.headers || '');

  const setUrlField = (val) => { setUrl(val); updateNodeField(id, 'url', val); };
  const setMethodField = (val) => { setMethod(val); updateNodeField(id, 'method', val); };
  const setHeadersField = (val) => { setHeaders(val); updateNodeField(id, 'headers', val); };

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
        onChange={setMethodField}
        options={[
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
        ]}
      />
      <TextField label="URL" value={url} onChange={setUrlField} placeholder="https://api.example.com/data" />
      <TextAreaField label="Headers" value={headers} onChange={setHeadersField} placeholder='{"Authorization": "Bearer ..."}' rows={2} />
    </BaseNode>
  );
};
