// useNodeField.js
// Eliminates the dual useState + updateNodeField anti-pattern present in every
// node component. State lives exclusively in the Zustand store; the hook
// returns [value, setter] exactly like useState but is store-backed.

import { useCallback } from 'react';
import { useStore } from '../store';

/**
 * @param {string} id          - Node ID
 * @param {string} fieldName   - Key in node.data
 * @param {*}      defaultValue - Used when the store has no value yet
 * @returns {[value, setValue]}
 */
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
