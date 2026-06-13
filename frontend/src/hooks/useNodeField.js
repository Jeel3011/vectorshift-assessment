import { useCallback } from 'react';
import { useStore } from '../store';

export const useNodeField = (id, fieldName, defaultValue) => {
  const value = useStore(
    (state) => state.nodesMap[id]?.data?.[fieldName] ?? defaultValue
  );
  const updateNodeField = useStore((state) => state.updateNodeField);

  const setValue = useCallback(
    (val) => updateNodeField(id, fieldName, val),
    [id, fieldName, updateNodeField]
  );

  return [value, setValue];
};
