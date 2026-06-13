// store.js
// Normalized Zustand store with localStorage persistence.
//
// Key improvements over the original:
//   - nodesMap (id → node) for O(1) updateNodeField instead of O(N) array scan
//   - Atomic getNodeID via producer-function set() — no race condition
//   - Duplicate-edge guard on onConnect
//   - localStorage persistence via zustand/middleware persist
//   - Derived `nodes` / `edges` arrays for ReactFlow compatibility

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

// ReactFlow still wants flat arrays; derive them from the map on every selector read.
// The map is the source of truth — the flat arrays are NOT stored separately.

const initialState = {
  nodesMap: {},   // { [id: string]: ReactFlowNode }
  edges: [],
  nodeIDs: {},    // { [type: string]: number }  — monotonic counters per type
};

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Derived selector helpers ──────────────────────────────────────────
      // Call get().nodes anywhere you need the flat array ReactFlow expects.
      get nodes() {
        return Object.values(get().nodesMap);
      },

      // ── Atomic ID generation (no race condition under concurrent drops) ───
      getNodeID: (type) => {
        let newID;
        set((state) => {
          const count = (state.nodeIDs[type] ?? 0) + 1;
          newID = `${type}-${count}`;
          return { nodeIDs: { ...state.nodeIDs, [type]: count } };
        });
        return newID;
      },

      // ── Node CRUD ─────────────────────────────────────────────────────────
      addNode: (node) => {
        set((state) => ({
          nodesMap: { ...state.nodesMap, [node.id]: node },
        }));
      },

      // O(1) field update — no full-array scan
      updateNodeField: (nodeId, fieldName, fieldValue) => {
        set((state) => {
          const existing = state.nodesMap[nodeId];
          if (!existing) return state;
          return {
            nodesMap: {
              ...state.nodesMap,
              [nodeId]: {
                ...existing,
                data: { ...existing.data, [fieldName]: fieldValue },
              },
            },
          };
        });
      },

      // ── ReactFlow change handlers ─────────────────────────────────────────
      onNodesChange: (changes) => {
        set((state) => {
          const flatNodes = applyNodeChanges(changes, Object.values(state.nodesMap));
          const nodesMap = {};
          for (const n of flatNodes) nodesMap[n.id] = n;
          return { nodesMap };
        });
      },

      onEdgesChange: (changes) => {
        set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
      },

      onConnect: (connection) => {
        // Belt-and-suspenders: reject self-loops and duplicate connections
        if (connection.source === connection.target) return;
        set((state) => {
          const isDuplicate = state.edges.some(
            (e) =>
              e.source === connection.source &&
              e.target === connection.target &&
              e.sourceHandle === connection.sourceHandle &&
              e.targetHandle === connection.targetHandle
          );
          if (isDuplicate) return state;
          return { edges: addEdge(connection, state.edges) };
        });
      },

      // ── Canvas ops ────────────────────────────────────────────────────────
      clearCanvas: () => {
        set({ nodesMap: {}, edges: [], nodeIDs: {} });
      },
    }),
    {
      name: "pipeline-store-v1",
      storage: createJSONStorage(() => localStorage),
      // Only persist the data, not the action functions
      partialize: (state) => ({
        nodesMap: state.nodesMap,
        edges: state.edges,
        nodeIDs: state.nodeIDs,
      }),
    }
  )
);
