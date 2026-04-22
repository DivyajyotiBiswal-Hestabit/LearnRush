from __future__ import annotations
import re
from typing import Dict, Optional, Type
from nexus_ai.agents.base_agent import BaseAgent
from nexus_ai.agents.agents import (
    OrchestratorAgent, PlannerAgent, ResearcherAgent, CoderAgent,
    AnalystAgent, CriticAgent, OptimizerAgent, ValidatorAgent, ReporterAgent,
)
from nexus_ai.memory.memory_manager import MemoryManager
from nexus_ai.utils.logger import Tracer, get_logger

logger = get_logger("registry")

AGENT_REGISTRY: Dict[str, Type[BaseAgent]] = {
    "orchestrator": OrchestratorAgent,
    "planner":      PlannerAgent,
    "researcher":   ResearcherAgent,
    "coder":        CoderAgent,
    "analyst":      AnalystAgent,
    "critic":       CriticAgent,
    "optimizer":    OptimizerAgent,
    "validator":    ValidatorAgent,
    "reporter":     ReporterAgent,
}

# Catches anything the LLM might hallucinate
_FUZZY_MAP = {
    # researcher variants
    "research":    "researcher",
    "search":      "researcher",
    "gather":      "researcher",
    "scout":       "researcher",
    "market":      "researcher",
    "knowledge":   "researcher",
    "idea":        "researcher",   # "idea generator agent" → researcher
    "brainstorm":  "researcher",
    "ideation":    "researcher",
    "creative":    "researcher",
    "strategy":    "researcher",
    # analyst variants
    "analy":       "analyst",      # analyst / analysis / analyzer
    "data":        "analyst",
    "business":    "analyst",
    "finance":     "analyst",
    "financial":   "analyst",
    "insight":     "analyst",
    "report":      "reporter",
    # coder variants
    "cod":         "coder",        # coder / coding / code
    "develop":     "coder",
    "engineer":    "coder",
    "implement":   "coder",
    "architect":   "coder",
    "build":       "coder",
    "program":     "coder",
    # critic variants
    "critic":      "critic",
    "review":      "critic",
    "evaluat":     "critic",
    "assess":      "critic",
    "audit":       "critic",
    "quality":     "critic",
    # optimizer variants
    "optim":       "optimizer",
    "improv":      "optimizer",
    "refin":       "optimizer",
    "enhanc":      "optimizer",
    # validator variants
    "valid":       "validator",
    "verif":       "validator",
    "test":        "validator",
    "check":       "validator",
    "certif":      "validator",
    # planner variants
    "plan":        "planner",
    "schedul":     "planner",
    "decompos":    "planner",
    "organiz":     "planner",
    # reporter variants
    "report":      "reporter",
    "summar":      "reporter",
    "compil":      "reporter",
    "present":     "reporter",
    "document":    "reporter",
    "write":       "reporter",
}


def resolve_agent_name(raw: str) -> str:
    """
    Map any string the LLM might return to a valid registry key.
    Strategy:
      1. Exact match (after lowercase + strip)
      2. Keyword fuzzy match against _FUZZY_MAP
      3. Default to 'researcher'
    """
    name = raw.lower().strip()
    name = re.sub(r"[^a-z0-9 ]", " ", name).strip()

    # 1. exact
    if name in AGENT_REGISTRY:
        return name

    # 2. fuzzy — check if any keyword appears as a substring
    for keyword, canonical in _FUZZY_MAP.items():
        if keyword in name:
            logger.warning(f"Agent name '{raw}' → fuzzy-mapped to '{canonical}'")
            return canonical

    # 3. default
    logger.warning(f"Unknown agent '{raw}' — defaulting to 'researcher'")
    return "researcher"


class AgentFactory:
    """Creates and caches agent instances for a session."""

    def __init__(self, memory: MemoryManager, tracer: Tracer, api_key: str = ""):
        self._memory  = memory
        self._tracer  = tracer
        self._api_key = api_key
        self._cache: Dict[str, BaseAgent] = {}

    def get(self, agent_name: str) -> BaseAgent:
        """Return a cached agent instance; fuzzy-resolve unknown names."""
        canonical = resolve_agent_name(agent_name)
        if canonical not in self._cache:
            cls = AGENT_REGISTRY[canonical]
            self._cache[canonical] = cls(
                memory=self._memory,
                tracer=self._tracer,
                api_key=self._api_key,
            )
            logger.debug(f"Agent instantiated: {canonical}")
        return self._cache[canonical]

    def all_agents(self) -> Dict[str, BaseAgent]:
        for name in AGENT_REGISTRY:
            self.get(name)
        return self._cache

    def list_agents(self):
        return list(AGENT_REGISTRY.keys())