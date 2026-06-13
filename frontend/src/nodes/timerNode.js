// timerNode.js
import { memo } from 'react';
import { BaseNode, NumberField, SelectField } from './BaseNode';
import { useNodeField } from '../hooks/useNodeField';
import { TimerIcon } from '../icons';

export const TimerNode = memo(({ id, data }) => {
  const [delay, setDelay] = useNodeField(id, 'delay', data?.delay ?? 1000);
  const [unit,  setUnit]  = useNodeField(id, 'unit',  data?.unit  ?? 'ms');

  // Guard: ensure delay is always a finite number, never NaN
  const handleDelayChange = (val) => {
    const n = Number(val);
    setDelay(Number.isFinite(n) ? n : 0);
  };

  return (
    <BaseNode
      id={id}
      title="Timer"
      icon={TimerIcon}
      accentColor="#a855f7"
      handles={[
        { type: 'target', position: 'left',  id: 'trigger', label: 'Trigger' },
        { type: 'source', position: 'right', id: 'done',    label: 'Done'    },
      ]}
    >
      <NumberField label="Delay" value={delay} onChange={handleDelayChange} min={0} max={60000} step={100} />
      <SelectField
        label="Unit"
        value={unit}
        onChange={setUnit}
        options={[
          { value: 'ms', label: 'Milliseconds' },
          { value: 's',  label: 'Seconds'      },
          { value: 'm',  label: 'Minutes'      },
        ]}
      />
    </BaseNode>
  );
});

TimerNode.displayName = 'TimerNode';
