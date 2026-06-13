// apiCallNode.js
import { memo } from 'react';
import { BaseNode, TextField, SelectField, TextAreaField } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { ApiIcon } from '../icons';

export const ApiCallNode = memo(({ id, data }) => {
  const [url,     setUrl]     = useNodeField(id, 'url',     data?.url     ?? '');
  const [method,  setMethod]  = useNodeField(id, 'method',  data?.method  ?? 'GET');
  const [headers, setHeaders] = useNodeField(id, 'headers', data?.headers ?? '');

  return (
    <BaseNode
      id={id}
      title="API Call"
      icon={ApiIcon}
      accentColor="#ef4444"
      handles={[
        { type: 'target', position: 'left',  id: 'body',     label: 'Body'     },
        { type: 'source', position: 'right', id: 'response', label: 'Response' },
      ]}
    >
      <SelectField
        label="Method"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'GET',    label: 'GET'    },
          { value: 'POST',   label: 'POST'   },
          { value: 'PUT',    label: 'PUT'    },
          { value: 'DELETE', label: 'DELETE' },
        ]}
      />
      <TextField
        label="URL"
        value={url}
        onChange={setUrl}
        placeholder="https://api.example.com/data"
      />
      <TextAreaField
        label="Headers (JSON)"
        value={headers}
        onChange={setHeaders}
        placeholder='{"Authorization": "Bearer ..."}'
        rows={2}
      />
    </BaseNode>
  );
});

ApiCallNode.displayName = 'ApiCallNode';
