// chatNode.js
import { memo } from 'react';
import { BaseNode, TextField, SelectField, TextAreaField } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { ChatIcon } from '../icons';

export const ChatNode = memo(({ id, data }) => {
  const [persona,  setPersona]  = useNodeField(id, 'persona',  data?.persona  ?? 'Helpful Assistant');
  const [greeting, setGreeting] = useNodeField(id, 'greeting', data?.greeting ?? 'Hi! How can I help you today?');
  const [model,    setModel]    = useNodeField(id, 'model',    data?.model    ?? 'gpt-4o');

  return (
    <BaseNode
      id={id}
      title="Chat"
      icon={ChatIcon}
      accentColor="#06b6d4"
      handles={[
        { type: 'target', position: 'left',  id: 'context', label: 'Context' },
        { type: 'target', position: 'left',  id: 'history', label: 'History' },
        { type: 'source', position: 'right', id: 'reply',   label: 'Reply'   },
      ]}
    >
      <TextField label="Persona" value={persona} onChange={setPersona} placeholder="Role name..." />
      <SelectField
        label="Model"
        value={model}
        onChange={setModel}
        options={[
          { value: 'gpt-4o',            label: 'GPT-4o'            },
          { value: 'gpt-4o-mini',       label: 'GPT-4o Mini'       },
          { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
          { value: 'gemini-pro',        label: 'Gemini Pro'        },
        ]}
      />
      <TextAreaField label="Greeting" value={greeting} onChange={setGreeting} placeholder="Initial message..." rows={2} />
    </BaseNode>
  );
});

ChatNode.displayName = 'ChatNode';
