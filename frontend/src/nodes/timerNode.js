// timerNode.js
// Delay/timer node — demonstrates NumberField and SelectField

import { useState } from 'react';
import { useStore } from '../store';
import { BaseNode, NumberField, SelectField } from './BaseNode';
import { TimerIcon } from '../icons';

export const TimerNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [delay, setDelay] = useState(data?.delay || 1000);
  const [unit, setUnit] = useState(data?.unit || 'ms');

  const setDelayField = (val) => { setDelay(val); updateNodeField(id, 'delay', val); };
  const setUnitField = (val) => { setUnit(val); updateNodeField(id, 'unit', val); };

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
      <NumberField label="Delay" value={delay} onChange={setDelayField} min={0} max={60000} step={100} />
      <SelectField
        label="Unit"
        value={unit}
        onChange={setUnitField}
        options={[
          { value: 'ms', label: 'Milliseconds' },
          { value: 's', label: 'Seconds' },
          { value: 'm', label: 'Minutes' },
        ]}
      />
    </BaseNode>
  );
};
