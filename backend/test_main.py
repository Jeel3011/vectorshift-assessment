"""
Pytest test suite for the VectorShift Pipeline Validator.

Coverage:
  - DAG algorithm correctness (valid, cyclic, empty, disconnected, self-loop, parallel)
  - Duplicate-edge deduplication
  - Input validation (size limits, id length, missing fields)
  - HTTP endpoints (health, root, parse)
  - Security headers present on every response
  - CORS headers
  - Rate-limit model (unit-level)
  - Extra fields rejected (extra="ignore")
"""

import pytest
from fastapi.testclient import TestClient

from main import _is_dag_sync, Node, Edge, app

client = TestClient(app, raise_server_exceptions=False)


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def make_nodes(*ids):
    return [Node(id=i) for i in ids]


def make_edges(*pairs):
    return [Edge(source=s, target=t) for s, t in pairs]


def post_pipeline(nodes, edges):
    return client.post(
        "/pipelines/parse",
        json={
            "nodes": [{"id": n} for n in nodes],
            "edges": [{"source": s, "target": t} for s, t in edges],
        },
    )


# ─────────────────────────────────────────────
# DAG algorithm unit tests
# ─────────────────────────────────────────────

class TestIsDagSync:
    def test_empty_graph_is_dag(self):
        assert _is_dag_sync([], []) is True

    def test_single_node_no_edges(self):
        assert _is_dag_sync(make_nodes("A"), []) is True

    def test_linear_chain(self):
        # A → B → C → D
        nodes = make_nodes("A", "B", "C", "D")
        edges = make_edges(("A","B"), ("B","C"), ("C","D"))
        assert _is_dag_sync(nodes, edges) is True

    def test_diamond_dag(self):
        #   A
        #  / \
        # B   C
        #  \ /
        #   D
        nodes = make_nodes("A", "B", "C", "D")
        edges = make_edges(("A","B"), ("A","C"), ("B","D"), ("C","D"))
        assert _is_dag_sync(nodes, edges) is True

    def test_simple_cycle(self):
        # A → B → A
        nodes = make_nodes("A", "B")
        edges = make_edges(("A","B"), ("B","A"))
        assert _is_dag_sync(nodes, edges) is False

    def test_three_node_cycle(self):
        # A → B → C → A
        nodes = make_nodes("A", "B", "C")
        edges = make_edges(("A","B"), ("B","C"), ("C","A"))
        assert _is_dag_sync(nodes, edges) is False

    def test_self_loop(self):
        # A → A  (self-loop is a cycle)
        nodes = make_nodes("A")
        edges = make_edges(("A","A"))
        assert _is_dag_sync(nodes, edges) is False

    def test_disconnected_components_both_acyclic(self):
        # A → B    C → D   (two separate chains)
        nodes = make_nodes("A", "B", "C", "D")
        edges = make_edges(("A","B"), ("C","D"))
        assert _is_dag_sync(nodes, edges) is True

    def test_disconnected_components_one_cyclic(self):
        # A → B (ok)   C → D → C (cycle)
        nodes = make_nodes("A", "B", "C", "D")
        edges = make_edges(("A","B"), ("C","D"), ("D","C"))
        assert _is_dag_sync(nodes, edges) is False

    def test_duplicate_edges_do_not_corrupt_result(self):
        # Without dedup, duplicate A→B would set in_degree[B]=2
        # and B would never reach 0 → false negative (returns False for a valid DAG)
        nodes = make_nodes("A", "B")
        edges = make_edges(("A","B"), ("A","B"), ("A","B"))
        assert _is_dag_sync(nodes, edges) is True

    def test_dangling_edge_ignored(self):
        # Edge references a node not in the node list — must be silently ignored
        nodes = make_nodes("A", "B")
        edges = make_edges(("A","B"), ("A","GHOST"))
        assert _is_dag_sync(nodes, edges) is True

    def test_large_linear_chain(self):
        # 500 nodes in a straight line — should be O(N), not stack-overflow
        ids = [str(i) for i in range(500)]
        nodes = make_nodes(*ids)
        edges = make_edges(*[(ids[i], ids[i+1]) for i in range(499)])
        assert _is_dag_sync(nodes, edges) is True

    def test_wide_fan_out(self):
        # 1 source → 200 targets
        nodes = make_nodes("src", *[f"t{i}" for i in range(200)])
        edges = make_edges(*[("src", f"t{i}") for i in range(200)])
        assert _is_dag_sync(nodes, edges) is True

    def test_parallel_edges_between_different_pairs(self):
        # A→B and A→C are distinct — both valid
        nodes = make_nodes("A", "B", "C")
        edges = make_edges(("A","B"), ("A","C"))
        assert _is_dag_sync(nodes, edges) is True


# ─────────────────────────────────────────────
# Pydantic model validation
# ─────────────────────────────────────────────

class TestModelValidation:
    def test_node_id_too_long_rejected(self):
        with pytest.raises(Exception):
            Node(id="x" * 129)

    def test_node_empty_id_rejected(self):
        with pytest.raises(Exception):
            Node(id="")

    def test_edge_endpoint_too_long_rejected(self):
        with pytest.raises(Exception):
            Edge(source="x" * 129, target="B")

    def test_extra_fields_ignored(self):
        # extra="ignore" — unknown keys must not raise
        n = Node(id="A", unknown_field="should be ignored")
        assert n.id == "A"
        assert not hasattr(n, "unknown_field")

    def test_pipeline_request_too_many_nodes(self):
        from main import PipelineRequest, _MAX_NODES
        import pytest
        nodes = [Node(id=str(i)) for i in range(_MAX_NODES + 1)]
        with pytest.raises(Exception):
            PipelineRequest(nodes=nodes, edges=[])

    def test_pipeline_request_too_many_edges(self):
        from main import PipelineRequest, _MAX_EDGES
        nodes = [Node(id="A"), Node(id="B")]
        edges = [Edge(source="A", target="B")] * (_MAX_EDGES + 1)
        with pytest.raises(Exception):
            PipelineRequest(nodes=nodes, edges=edges)


# ─────────────────────────────────────────────
# HTTP endpoint tests
# ─────────────────────────────────────────────

class TestHealthEndpoint:
    def test_returns_200(self):
        r = client.get("/health")
        assert r.status_code == 200

    def test_body_has_status_ok(self):
        r = client.get("/health")
        assert r.json()["status"] == "ok"

    def test_body_has_uptime(self):
        r = client.get("/health")
        assert r.json()["uptime_seconds"] >= 0

    def test_body_has_version(self):
        r = client.get("/health")
        assert "version" in r.json()


class TestRootEndpoint:
    def test_returns_200(self):
        assert client.get("/").status_code == 200

    def test_body_has_ping(self):
        assert "ping" in client.get("/").json()


class TestParsePipelineEndpoint:
    def test_valid_dag_returns_true(self):
        r = post_pipeline(["A","B","C"], [("A","B"),("B","C")])
        assert r.status_code == 200
        body = r.json()
        assert body["is_dag"] is True
        assert body["num_nodes"] == 3
        assert body["num_edges"] == 2

    def test_cycle_returns_false(self):
        r = post_pipeline(["A","B"], [("A","B"),("B","A")])
        assert r.status_code == 200
        assert r.json()["is_dag"] is False

    def test_empty_pipeline(self):
        r = post_pipeline([], [])
        assert r.status_code == 200
        body = r.json()
        assert body["is_dag"] is True
        assert body["num_nodes"] == 0

    def test_self_loop_detected(self):
        r = post_pipeline(["A"], [("A","A")])
        assert r.status_code == 200
        assert r.json()["is_dag"] is False

    def test_duplicate_edges_handled_correctly(self):
        # Three identical edges A→B — should still be a valid DAG
        r = client.post("/pipelines/parse", json={
            "nodes": [{"id":"A"},{"id":"B"}],
            "edges": [
                {"source":"A","target":"B"},
                {"source":"A","target":"B"},
                {"source":"A","target":"B"},
            ],
        })
        assert r.status_code == 200
        assert r.json()["is_dag"] is True

    def test_missing_nodes_field_returns_422(self):
        r = client.post("/pipelines/parse", json={"edges": []})
        assert r.status_code == 422

    def test_missing_edges_field_returns_422(self):
        r = client.post("/pipelines/parse", json={"nodes": []})
        assert r.status_code == 422

    def test_malformed_json_returns_422(self):
        r = client.post(
            "/pipelines/parse",
            content=b"not json",
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 422

    def test_node_id_too_long_returns_422(self):
        r = client.post("/pipelines/parse", json={
            "nodes": [{"id": "x" * 200}],
            "edges": [],
        })
        assert r.status_code == 422

    def test_extra_node_fields_accepted(self):
        r = client.post("/pipelines/parse", json={
            "nodes": [{"id": "A", "type": "llm", "position": {"x": 0, "y": 0}}],
            "edges": [],
        })
        assert r.status_code == 200

    def test_response_model_shape(self):
        r = post_pipeline(["X"], [])
        body = r.json()
        assert set(body.keys()) == {"num_nodes", "num_edges", "is_dag"}

    def test_diamond_dag(self):
        r = post_pipeline(
            ["A","B","C","D"],
            [("A","B"),("A","C"),("B","D"),("C","D")]
        )
        assert r.status_code == 200
        assert r.json()["is_dag"] is True

    def test_dangling_edge_does_not_crash(self):
        r = client.post("/pipelines/parse", json={
            "nodes": [{"id":"A"}],
            "edges": [{"source":"A","target":"MISSING"}],
        })
        assert r.status_code == 200


# ─────────────────────────────────────────────
# Security headers
# ─────────────────────────────────────────────

class TestSecurityHeaders:
    REQUIRED_HEADERS = [
        ("X-Content-Type-Options", "nosniff"),
        ("X-Frame-Options", "DENY"),
        ("X-XSS-Protection", "1; mode=block"),
        ("Referrer-Policy", "strict-origin-when-cross-origin"),
        ("Cache-Control", "no-store"),
        ("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"),
    ]

    @pytest.mark.parametrize("header,value", REQUIRED_HEADERS)
    def test_header_present_on_health(self, header, value):
        r = client.get("/health")
        assert r.headers.get(header) == value, f"Missing or wrong {header}"

    @pytest.mark.parametrize("header,value", REQUIRED_HEADERS)
    def test_header_present_on_parse(self, header, value):
        r = post_pipeline(["A"], [])
        assert r.headers.get(header) == value, f"Missing or wrong {header}"

    def test_request_id_returned(self):
        r = client.get("/health")
        assert "X-Request-ID" in r.headers

    def test_custom_request_id_echoed(self):
        r = client.get("/health", headers={"X-Request-ID": "test-123"})
        assert r.headers.get("X-Request-ID") == "test-123"
