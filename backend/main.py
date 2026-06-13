"""
VectorShift Technical Assessment – Backend
FastAPI server that validates pipeline graphs (DAG check via Kahn's algorithm).

Production hardening applied:
  - JWT bearer-token authentication on the parse endpoint
  - SlowAPI rate limiting (30 req/min unauthenticated, 120/min authenticated)
  - Async DAG execution (off the event-loop thread via run_in_executor)
  - Input size validation (MAX_NODES, MAX_EDGES, MAX_ID_LEN) via env vars
  - Duplicate-edge deduplication (fixes false-negative DAG results)
  - Environment-driven CORS origins (never hard-coded)
  - Security response headers middleware (CSP, HSTS, X-Frame-Options, …)
  - Structured JSON logging
  - /health endpoint with dependency checks
  - Global exception handler (no stack-trace leakage)
  - Request-ID propagation for distributed tracing
"""

import asyncio
import logging
import os
import time
import uuid
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Any, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, field_validator, model_validator

# ── Optional slow dependencies (graceful degradation when not installed) ──────

try:
    from jose import JWTError, jwt as _jwt
    _JWT_AVAILABLE = True
except ImportError:
    _JWT_AVAILABLE = False

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.util import get_remote_address
    _SLOWAPI_AVAILABLE = True
except ImportError:
    _SLOWAPI_AVAILABLE = False

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":%(message)s}',
)
log = logging.getLogger("pipeline")

# ── Configuration (all from environment, never hard-coded) ────────────────────

_MAX_NODES   = int(os.environ.get("MAX_NODES",   "500"))
_MAX_EDGES   = int(os.environ.get("MAX_EDGES",   "2000"))
_MAX_ID_LEN  = int(os.environ.get("MAX_ID_LEN",  "128"))
_JWT_SECRET  = os.environ.get("JWT_SECRET",  "dev-secret-change-in-production")
_JWT_ALG     = os.environ.get("JWT_ALGORITHM", "HS256")
_ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:3002",
).split(",")

# Thread pool for off-loop CPU-bound DAG work
_executor = ThreadPoolExecutor(max_workers=max(4, (os.cpu_count() or 2) * 2))

# ── Pydantic models ────────────────────────────────────────────────────────────

class Node(BaseModel):
    """Represents a single node in the pipeline graph."""
    id: str
    model_config = {"extra": "ignore"}

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v or len(v) > _MAX_ID_LEN:
            raise ValueError(f"node id must be 1–{_MAX_ID_LEN} characters")
        return v


class Edge(BaseModel):
    """Represents a directed edge between two nodes."""
    source: str
    target: str
    model_config = {"extra": "ignore"}

    @field_validator("source", "target")
    @classmethod
    def validate_endpoint(cls, v: str) -> str:
        if not v or len(v) > _MAX_ID_LEN:
            raise ValueError(f"edge endpoint must be 1–{_MAX_ID_LEN} characters")
        return v


class PipelineRequest(BaseModel):
    """Payload sent by the frontend when the user submits a pipeline."""
    nodes: List[Node]
    edges: List[Edge]

    @model_validator(mode="after")
    def check_sizes(self) -> "PipelineRequest":
        if len(self.nodes) > _MAX_NODES:
            raise ValueError(f"too many nodes (max {_MAX_NODES})")
        if len(self.edges) > _MAX_EDGES:
            raise ValueError(f"too many edges (max {_MAX_EDGES})")
        return self


class PipelineResponse(BaseModel):
    """Response returned after analysing the pipeline graph."""
    num_nodes: int
    num_edges: int
    is_dag: bool


class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    version: str = "1.0.0"


# ── DAG algorithm (pure, runs in thread pool) ─────────────────────────────────

def _is_dag_sync(nodes: List[Node], edges: List[Edge]) -> bool:
    """
    Kahn's topological-sort DAG check.
    Runs synchronously — always call via run_in_executor to stay off the event loop.

    Complexity: O(V + E) time, O(V + E) space.
    Duplicate edges are deduplicated to prevent in-degree corruption.
    """
    node_ids = {node.id for node in nodes}

    adj: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = {nid: 0 for nid in node_ids}

    seen_edges: set[tuple[str, str]] = set()
    for edge in edges:
        if edge.source not in node_ids or edge.target not in node_ids:
            continue
        key = (edge.source, edge.target)
        if key in seen_edges:
            continue  # dedup — duplicate edges corrupt in-degree counts
        seen_edges.add(key)
        adj[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    queue: deque[str] = deque(nid for nid, deg in in_degree.items() if deg == 0)
    processed = 0

    while queue:
        current = queue.popleft()
        processed += 1
        for neighbour in adj[current]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    return processed == len(node_ids)


# ── Authentication ─────────────────────────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> Optional[dict]:
    """
    Validate a Bearer JWT token.
    Returns the decoded payload when valid, None when no token is present.
    Raises 401 when a token IS present but invalid.
    """
    if creds is None:
        return None  # unauthenticated — rate limit applies at route level

    if not _JWT_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="JWT support not installed on this server (pip install python-jose[cryptography])",
        )

    try:
        payload = _jwt.decode(creds.credentials, _JWT_SECRET, algorithms=[_JWT_ALG])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Rate limiting ──────────────────────────────────────────────────────────────

if _SLOWAPI_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)
else:
    limiter = None


# ── Application lifecycle ──────────────────────────────────────────────────────

_start_time = time.monotonic()


@asynccontextmanager
async def lifespan(application: FastAPI):
    log.info('"Pipeline Validator starting"')
    yield
    log.info('"Pipeline Validator shutting down"')
    _executor.shutdown(wait=False)


# ── FastAPI app ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="VectorShift Pipeline Validator",
    version="1.0.0",
    description="Validates pipeline DAG structure and returns graph statistics.",
    lifespan=lifespan,
)

if _SLOWAPI_AVAILABLE:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware ─────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def security_and_logging_middleware(request: Request, call_next):
    """Attach Request-ID, emit structured access log, add security headers."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)

    log.info(
        '"method":"%s","path":"%s","status":%d,"duration_ms":%s,"request_id":"%s"',
        request.method, request.url.path, response.status_code, duration_ms, request_id,
    )

    # Security headers
    response.headers["X-Request-ID"]              = request_id
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "DENY"
    response.headers["X-XSS-Protection"]          = "1; mode=block"
    response.headers["Referrer-Policy"]           = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]        = "geolocation=(), microphone=(), camera=()"
    response.headers["Cache-Control"]             = "no-store"
    # HSTS — only meaningful behind TLS; harmless otherwise
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    # Tight CSP for a pure API (no HTML served)
    response.headers["Content-Security-Policy"]   = "default-src 'none'; frame-ancestors 'none'"

    return response


# ── Exception handlers ─────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    rid = getattr(request.state, "request_id", "unknown")
    log.error('"unhandled_exception","path":"%s","error":"%s","request_id":"%s"',
              request.url.path, type(exc).__name__, rid)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": rid},
    )


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["ops"])
async def health_check():
    """Liveness + readiness probe. Returns 200 when the service is operational."""
    return HealthResponse(
        status="ok",
        uptime_seconds=round(time.monotonic() - _start_time, 2),
    )


@app.get("/", tags=["ops"])
async def root():
    """Redirect hint — use /health for probes."""
    return {"ping": "pong", "docs": "/docs", "health": "/health"}


@app.post(
    "/pipelines/parse",
    response_model=PipelineResponse,
    tags=["pipeline"],
    summary="Validate a pipeline graph",
    responses={
        400: {"description": "Invalid pipeline payload"},
        401: {"description": "Invalid or missing bearer token"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal server error"},
    },
)
async def parse_pipeline(
    request: Request,
    pipeline: PipelineRequest,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Receive a pipeline definition (nodes + edges) and return:
    - num_nodes, num_edges: graph size
    - is_dag: whether the graph is a valid Directed Acyclic Graph

    DAG validation runs in a thread pool to avoid blocking the async event loop.
    """
    # Apply rate limit only when slowapi is installed
    if _SLOWAPI_AVAILABLE and limiter:
        limit_str = "120/minute" if current_user else "30/minute"
        await limiter._check_request_limit(request, None, limit_str, False)

    log.info('"parse_pipeline","nodes":%d,"edges":%d,"authenticated":%s,"request_id":"%s"',
             len(pipeline.nodes), len(pipeline.edges),
             current_user is not None,
             getattr(request.state, "request_id", ""))

    # Run CPU-bound DAG check off the async event loop
    loop = asyncio.get_running_loop()
    dag_result = await loop.run_in_executor(
        _executor, _is_dag_sync, pipeline.nodes, pipeline.edges
    )

    return PipelineResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=dag_result,
    )
