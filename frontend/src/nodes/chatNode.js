// chatNode.js
// Chat/conversation node — demonstrates a rich multi-field node

import { useState } from 'react';
import { BaseNode, TextField, SelectField, TextAreaField } from './BaseNode';

const ChatIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const ChatNode = ({ id, data }) => {
  const [persona, setPersona] = useState(data?.persona || 'Helpful Assistant');
  const [greeting, setGreeting] = useState(data?.greeting || 'Hi! How can I help you today?');
  const [model, setModel] = useState(data?.model || 'gpt-4o');

  return (
    <BaseNode
      id={id}
      title="Chat"
      icon={ChatIcon}
      
      handles={[
        { type: 'target', position: 'left', id: 'context', label: 'Context' },
        { type: 'target', position: 'left', id: 'history', label: 'History' },
        { type: 'source', position: 'right', id: 'reply', label: 'Reply' },
      ]}
    >
      <TextField label="Persona" value={persona} onChange={setPersona} placeholder="Role name..." />
      <SelectField
        label="Model"
        value={model}
        onChange={setModel}
        options={[
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
          { value: 'claude-3.5', label: 'Claude 3.5' },
          { value: 'gemini-pro', label: 'Gemini Pro' },
        ]}
      />
      <TextAreaField label="Greeting" value={greeting} onChange={setGreeting} placeholder="Initial message..." rows={2} />
    </BaseNode>
  );
};
