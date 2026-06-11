// timerNode.js
// Delay/timer node — demonstrates NumberField and SelectField

import { useState } from 'react';
import { BaseNode, NumberField, SelectField } from './BaseNode';

const TimerIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const TimerNode = ({ id, data }) => {
  const [delay, setDelay] = useState(data?.delay || 1000);
  const [unit, setUnit] = useState(data?.unit || 'ms');

  return (
    <BaseNode
      id={id}
      title="Timer"
      icon={TimerIcon}
      accentColor="#a855f7"
      handles={[
        { type: 'target', position: 'left', id: 'trigger', label: 'Trigger' },
        { type: 'source', position: 'right', id: 'done', label: 'Done' },
      ]}
    >
      <NumberField label="Delay" value={delay} onChange={setDelay} min={0} max={60000} step={100} />
      <SelectField
        label="Unit"
        value={unit}
        onChange={setUnit}
        options={[
          { value: 'ms', label: 'Milliseconds' },
          { value: 's', label: 'Seconds' },
          { value: 'm', label: 'Minutes' },
        ]}
      />
    </BaseNode>
  );
};
