import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

const initialState = {
  nodesMap: {},
  edges: [],
  nodeIDs: {},
};

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      get nodes() {
        return Object.values(get().nodesMap);
      },

      getNodeID: (type) => {
        let newID;
        set((state) => {
          const count = (state.nodeIDs[type] ?? 0) + 1;
          newID = `${type}-${count}`;
          return { nodeIDs: { ...state.nodeIDs, [type]: count } };
        });
        return newID;
      },

      addNode: (node) => {
        set((state) => ({
          nodesMap: { ...state.nodesMap, [node.id]: node },
        }));
      },

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

      clearCanvas: () => {
        set({ nodesMap: {}, edges: [], nodeIDs: {} });
      },
    }),
    {
      name: "pipeline-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodesMap: state.nodesMap,
        edges: state.edges,
        nodeIDs: state.nodeIDs,
      }),
    }
  )
);
