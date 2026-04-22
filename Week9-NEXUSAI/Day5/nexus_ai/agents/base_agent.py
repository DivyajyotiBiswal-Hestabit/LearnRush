from __future__ import annotations
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from nexus_ai.config import AGENT_ROLES, DEFAULT_MODEL, TEMPERATURE
from nexus_ai.memory.memory_manager import MemoryManager
from nexus_ai.utils.llm_client import GroqClient
from nexus_ai.utils.logger import Tracer, get_logger

logger = get_logger("agent.base")


class BaseAgent(ABC):
    name:  str = "base_agent"
    role:  str = ""
    model: str = DEFAULT_MODEL

    def __init__(
        self,
        memory:  MemoryManager,
        tracer:  Tracer,
        api_key: str = "",
    ):
        self.memory  = memory
        self.tracer  = tracer
        self._llm    = GroqClient(api_key=api_key, model=self.model)
        self._role   = self.role or AGENT_ROLES.get(self.name, "")

    def _build_system(self, extra: str = "") -> str:
        mem_ctx = self.memory.recall_as_context(extra or self.name)
        history = self.memory.get_history_as_string(max_turns=8)

        parts = [
            f"You are the **{self.name.upper()}** agent in the NEXUS AI system.",
            f"Your role: {self._role}",
        ]
        if mem_ctx:
            parts += ["", mem_ctx]
        if history:
            parts += ["", "[Recent conversation history:]", history]
        return "\n".join(parts)

    @abstractmethod
    def run(self, task: str, context: str = "", **kwargs) -> str:
        """Execute the agent's primary task. Must be overridden."""

    def _call_llm(self, system: str, user: str, model: str = "") -> str:
        return self._llm.system_user(
            system=system, user=user,
            model=model or self.model,
            temperature=TEMPERATURE,
        )

    def reflect(self, task: str, output: str) -> Dict[str, Any]:
        """
        Ask the LLM to score its own output and suggest improvements.
        Returns { score: float, feedback: str, improved: str }
        """
        prompt = f"""You produced the following output for the task below.
Rate it 0-10 and suggest ONE specific improvement.
Respond ONLY as JSON: {{"score": <float>, "feedback": "<str>", "improved": "<str>"}}

TASK: {task}

OUTPUT:
{output[:1500]}
"""
        raw = self._call_llm(
            system="You are an expert self-reviewer. Reply only with valid JSON.",
            user=prompt,
        )
        try:
            import json, re
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            data  = json.loads(match.group()) if match else {}
            score = float(data.get("score", 5))
            fb    = data.get("feedback", "")
            imp   = data.get("improved", output)
        except Exception:
            score, fb, imp = 5.0, "Could not parse reflection.", output

        self.tracer.reflection(self.name, score, fb)
        return {"score": score, "feedback": fb, "improved": imp}


    def switch_role(self, new_role: str):
        """Temporarily adopt a different persona/role."""
        logger.debug(f"{self.name} switching role → {new_role}")
        self._role = new_role

    def reset_role(self):
        self._role = AGENT_ROLES.get(self.name, self.role)


    def _timed_run(self, task: str, context: str = "", **kwargs) -> str:
        """Wrapper that records timing, logs memory, and traces."""
        t0 = time.time()
        self.tracer.task_start(self.name, task)
        try:
            output = self.run(task, context, **kwargs)
            self.memory.log_message("assistant", output, agent=self.name)
            self.memory.summarise_and_store(output, tag=self.name)
            self.tracer.task_end(self.name, task, "success",
                                 time.time() - t0, output)
            return output
        except Exception as e:
            self.tracer.error(self.name, str(e), e)
            self.tracer.task_end(self.name, task, "failed", time.time() - t0)
            return f"[{self.name} ERROR: {e}]"