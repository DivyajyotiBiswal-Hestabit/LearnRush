
from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

import networkx as nx

from nexus_ai.utils.logger import get_logger, Tracer

logger = get_logger("dag")


class NodeStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    SUCCESS   = "success"
    FAILED    = "failed"
    SKIPPED   = "skipped"


@dataclass
class TaskNode:
    id:          str
    name:        str
    agent:       str                    # which agent handles this node
    prompt:      str                    # task description for the agent
    deps:        List[str] = field(default_factory=list)   # ids of predecessor nodes
    status:      NodeStatus = NodeStatus.PENDING
    output:      str = ""
    retries:     int = 0
    max_retries: int = 2
    metadata:    Dict[str, Any] = field(default_factory=dict)
    started_at:  Optional[float] = None
    ended_at:    Optional[float] = None

    def duration(self) -> float:
        if self.started_at and self.ended_at:
            return round(self.ended_at - self.started_at, 3)
        return 0.0

    def to_dict(self) -> Dict:
        return {
            "id": self.id, "name": self.name, "agent": self.agent,
            "status": self.status.value, "retries": self.retries,
            "duration_s": self.duration(), "output_preview": self.output[:200],
        }


class ExecutionDAG:
    """
    DAG that tracks task nodes and their dependencies.
    Uses networkx for topological sort + cycle detection.
    """

    def __init__(self, session_id: str, tracer: Optional[Tracer] = None):
        self.session_id = session_id
        self.tracer     = tracer
        self._G         = nx.DiGraph()
        self._nodes: Dict[str, TaskNode] = {}


    def add_node(self, node: TaskNode):
        self._nodes[node.id] = node
        self._G.add_node(node.id, label=node.name)
        for dep in node.deps:
            self._G.add_edge(dep, node.id)   # dep must complete before node

        if self.tracer:
            self.tracer.dag_event("ADD_NODE", node.id,
                                  {"name": node.name, "agent": node.agent, "deps": node.deps})

    def from_plan(self, plan: List[Dict]) -> "ExecutionDAG":
        """
        Accept a list of dicts (from Planner LLM output) and build the graph.
        Each dict: { name, agent, prompt, deps (list of names or ids) }
        """
        name_to_id: Dict[str, str] = {}
        nodes_raw = []

        # First pass: assign IDs
        for item in plan:
            nid = str(uuid.uuid4())[:8]
            name_to_id[item["name"]] = nid
            nodes_raw.append((nid, item))

        # Second pass: resolve dep names → ids
        for nid, item in nodes_raw:
            dep_ids = [name_to_id[d] for d in item.get("deps", [])
                       if d in name_to_id]
            node = TaskNode(
                id=nid, name=item["name"],
                agent=item.get("agent", "researcher"),
                prompt=item["prompt"],
                deps=dep_ids,
                metadata=item.get("metadata", {}),
            )
            self.add_node(node)

        if not nx.is_directed_acyclic_graph(self._G):
            raise ValueError("Planner produced a cyclic dependency graph!")

        logger.info(f"DAG built: {len(self._nodes)} nodes, "
                    f"{self._G.number_of_edges()} edges")
        return self


    def ready_nodes(self) -> List[TaskNode]:
        """Nodes whose dependencies are all SUCCESS and whose own status is PENDING."""
        ready = []
        for nid, node in self._nodes.items():
            if node.status != NodeStatus.PENDING:
                continue
            deps_done = all(
                self._nodes[d].status == NodeStatus.SUCCESS
                for d in node.deps if d in self._nodes
            )
            if deps_done:
                ready.append(node)
        return ready

    def mark_running(self, node_id: str):
        n = self._nodes[node_id]
        n.status     = NodeStatus.RUNNING
        n.started_at = time.time()
        if self.tracer:
            self.tracer.dag_event("RUNNING", node_id, {"name": n.name})

    def mark_success(self, node_id: str, output: str):
        n = self._nodes[node_id]
        n.status   = NodeStatus.SUCCESS
        n.output   = output
        n.ended_at = time.time()
        if self.tracer:
            self.tracer.dag_event("SUCCESS", node_id,
                                  {"duration_s": n.duration(), "preview": output[:120]})

    def mark_failed(self, node_id: str, reason: str):
        n = self._nodes[node_id]
        n.retries += 1
        if n.retries >= n.max_retries:
            n.status   = NodeStatus.FAILED
            n.ended_at = time.time()
            # skip all dependents
            for dep in nx.descendants(self._G, node_id):
                if self._nodes[dep].status == NodeStatus.PENDING:
                    self._nodes[dep].status = NodeStatus.SKIPPED
            if self.tracer:
                self.tracer.dag_event("FAILED", node_id, {"reason": reason})
        else:
            # reset to pending for retry
            n.status = NodeStatus.PENDING
            logger.warning(f"Node {n.name} retry {n.retries}/{n.max_retries}")

    def is_complete(self) -> bool:
        return all(
            n.status in (NodeStatus.SUCCESS, NodeStatus.FAILED, NodeStatus.SKIPPED)
            for n in self._nodes.values()
        )

    def get_context_for_node(self, node_id: str) -> str:
        """Return outputs of all predecessor nodes as context string."""
        preds = list(nx.ancestors(self._G, node_id))
        lines = []
        for pid in preds:
            p = self._nodes.get(pid)
            if p and p.status == NodeStatus.SUCCESS:
                lines.append(f"[{p.name} output]\n{p.output[:500]}")
        return "\n\n".join(lines) if lines else ""

    def summary(self) -> Dict:
        counts = {s.value: 0 for s in NodeStatus}
        for n in self._nodes.values():
            counts[n.status.value] += 1
        return {
            "total": len(self._nodes),
            "statuses": counts,
            "nodes": [n.to_dict() for n in self._nodes.values()],
        }

    def get_node(self, node_id: str) -> Optional[TaskNode]:
        return self._nodes.get(node_id)

    def all_outputs(self) -> Dict[str, str]:
        return {n.name: n.output for n in self._nodes.values()
                if n.status == NodeStatus.SUCCESS}