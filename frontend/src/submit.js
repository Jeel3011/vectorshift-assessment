// submit.js
import { useState } from 'react';
import { useStore } from './store';
import { useShallow } from 'zustand/react/shallow';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:8001';
const TIMEOUT_MS = 30_000; // 30s — accounts for Vercel serverless cold starts

const selector = (state) => ({
  nodesMap:   state.nodesMap,
  edges:      state.edges,
  clearCanvas: state.clearCanvas,
});

export const SubmitButton = () => {
  const { nodesMap, edges, clearCanvas } = useStore(useShallow(selector));
  const nodes = Object.values(nodesMap);

  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE}/pipelines/parse`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nodes, edges }),
        signal:  controller.signal,
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const data = await response.json();
      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError(`Request timed out after ${TIMEOUT_MS / 1000} s — is the backend running?`);
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const closeModal = () => { setResult(null); setError(null); };

  const handleClear = () => {
    if (nodes.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    clearCanvas();
    setShowClearConfirm(false);
  };

  return (
    <>
      {/* Bottom bar */}
      <div className="submit-area">
        {/* Live stats */}
        <div className="pipeline-stats">
          <span className="pipeline-stat">
            <span className="pipeline-stat-num">{nodes.length}</span>
            <span className="pipeline-stat-label">node{nodes.length !== 1 ? 's' : ''}</span>
          </span>
          <span className="pipeline-stat-sep" />
          <span className="pipeline-stat">
            <span className="pipeline-stat-num">{edges.length}</span>
            <span className="pipeline-stat-label">edge{edges.length !== 1 ? 's' : ''}</span>
          </span>
        </div>

        <div className="submit-actions">
          {nodes.length > 0 && (
            <button
              className="clear-btn"
              type="button"
              onClick={handleClear}
              title="Clear canvas"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Clear
            </button>
          )}

          <button
            className="submit-btn"
            type="button"
            onClick={handleSubmit}
            disabled={loading || nodes.length === 0}
          >
            {loading && <span className="submit-btn-spinner" />}
            {loading ? 'Analyzing…' : 'Submit Pipeline'}
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="error-toast" role="alert" onClick={closeModal}>
          <span className="error-toast-icon">⚠</span>
          <span className="error-toast-msg">{error}</span>
          <button className="error-toast-close" onClick={closeModal} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Clear confirmation modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-card modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Clear canvas?</div>
            <p className="modal-body-text">
              This will remove all {nodes.length} node{nodes.length !== 1 ? 's' : ''} and {edges.length} edge{edges.length !== 1 ? 's' : ''}. This cannot be undone.
            </p>
            <div className="modal-action-row">
              <button className="modal-close-btn" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="modal-danger-btn" onClick={confirmClear}>Clear all</button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {result && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title">Pipeline Analysis</div>
              {result.is_dag ? (
                <span className="modal-badge modal-badge-ok">Valid DAG</span>
              ) : (
                <span className="modal-badge modal-badge-warn">Contains cycle</span>
              )}
            </div>

            <div className="modal-stats">
              <div className="modal-stat">
                <span className="modal-stat-label">Nodes</span>
                <span className="modal-stat-value">{result.num_nodes}</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-label">Edges</span>
                <span className="modal-stat-value">{result.num_edges}</span>
              </div>
              <div className="modal-stat">
                <span className="modal-stat-label">Directed Acyclic Graph</span>
                <span className={`modal-stat-badge ${result.is_dag ? 'is-dag' : 'not-dag'}`}>
                  {result.is_dag ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>

            {!result.is_dag && (
              <div className="modal-warning">
                <span className="modal-warning-icon">⚠</span>
                This pipeline contains a cycle. Execution engines require a DAG — remove the back-edge to fix it.
              </div>
            )}

            <button className="modal-close-btn" onClick={closeModal}>Done</button>
          </div>
        </div>
      )}
    </>
  );
};
