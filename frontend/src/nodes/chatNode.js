// chatNode.js
// Chat/conversation node — demonstrates a rich multi-field node

import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode, TextField, SelectField, TextAreaField } from './BaseNode';
import { ChatIcon } from '../icons';

export const ChatNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [persona, setPersona] = useState(data?.persona || 'Helpful Assistant');
  const [greeting, setGreeting] = useState(data?.greeting || 'Hi! How can I help you today?');
  const [model, setModel] = useState(data?.model || 'gpt-4o');

  const setPersonaField = (val) => { setPersona(val); updateNodeField(id, 'persona', val); };
  const setGreetingField = (val) => { setGreeting(val); updateNodeField(id, 'greeting', val); };
  const setModelField = (val) => { setModel(val); updateNodeField(id, 'model', val); };

  return (
    <BaseNode
      id={id}
      title="Chat"
      icon={ChatIcon}
      accentColor="#06b6d4"
      handles={[
        { type: 'target', position: 'left', id: 'context', label: 'Context' },
        { type: 'target', position: 'left', id: 'history', label: 'History' },
        { type: 'source', position: 'right', id: 'reply', label: 'Reply' },
      ]}
    >
      <TextField label="Persona" value={persona} onChange={setPersonaField} placeholder="Role name..." />
      <SelectField
        label="Model"
        value={model}
        onChange={setModelField}
        options={[
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
          { value: 'claude-3.5', label: 'Claude 3.5' },
          { value: 'gemini-pro', label: 'Gemini Pro' },
        ]}
      />
      <TextAreaField label="Greeting" value={greeting} onChange={setGreetingField} placeholder="Initial message..." rows={2} />
    </BaseNode>
  );
};
