"""
VectorShift Technical Assessment – Backend
FastAPI server that validates pipeline graphs (DAG check via Kahn's algorithm).
"""

from collections import defaultdict, deque
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ──────────────────────────────────────────────
# Pydantic models for request / response
# ──────────────────────────────────────────────

class Node(BaseModel):
    """Represents a single node in the pipeline graph."""
    id: str  # Every node must have an id; extra fields are allowed.

    class Config:
        extra = "allow"  # Accept arbitrary additional fields from the frontend.


class Edge(BaseModel):
    """Represents a directed edge between two nodes."""
    source: str
    target: str

    class Config:
        extra = "allow"


class PipelineRequest(BaseModel):
    """Payload sent by the frontend when the user submits a pipeline."""
    nodes: List[Node]
    edges: List[Edge]


class PipelineResponse(BaseModel):
    """Response returned after analysing the pipeline graph."""
    num_nodes: int
    num_edges: int
    is_dag: bool


# ──────────────────────────────────────────────
# FastAPI application
# ──────────────────────────────────────────────

app = FastAPI(title="VectorShift Pipeline Validator")

# Allow the React dev-server running on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Helper – DAG check using Kahn's algorithm
# ──────────────────────────────────────────────

def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """
    Determine whether the directed graph is a DAG (Directed Acyclic Graph)
    using Kahn's topological-sort algorithm.

    Algorithm outline:
      1. Build an adjacency list and compute the in-degree of every node.
      2. Seed a queue with all nodes whose in-degree is 0.
      3. While the queue is non-empty, pop a node, decrement the in-degree
         of each of its neighbours, and enqueue any neighbour whose in-degree
         drops to 0.
      4. If every node has been processed, the graph contains no cycle → DAG.
    """
    node_ids = {node.id for node in nodes}

    # Adjacency list: source → [targets]
    adj: dict[str, list[str]] = defaultdict(list)
    # In-degree count for each node
    in_degree: dict[str, int] = {nid: 0 for nid in node_ids}

    for edge in edges:
        if edge.source not in node_ids or edge.target not in node_ids:
            continue  # ignore dangling edges that reference unknown nodes
        adj[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    # Start with all zero-in-degree nodes
    queue: deque[str] = deque(
        nid for nid, deg in in_degree.items() if deg == 0
    )

    processed_count = 0

    while queue:
        current = queue.popleft()
        processed_count += 1

        for neighbour in adj[current]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    # If we processed every node, there is no cycle.
    return processed_count == len(node_ids)


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@app.get("/")
def root():
    """Health-check / ping endpoint."""
    return {"Ping": "Pong"}


@app.post("/pipelines/parse", response_model=PipelineResponse)
def parse_pipeline(pipeline: PipelineRequest):
    """
    Receive a pipeline definition (nodes + edges) from the frontend,
    and return basic graph statistics along with a DAG check.
    """
    num_nodes = len(pipeline.nodes)
    num_edges = len(pipeline.edges)
    dag = is_dag(pipeline.nodes, pipeline.edges)

    return PipelineResponse(
        num_nodes=num_nodes,
        num_edges=num_edges,
        is_dag=dag,
    )
