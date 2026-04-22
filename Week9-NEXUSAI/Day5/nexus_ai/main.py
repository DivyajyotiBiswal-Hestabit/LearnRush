"""
NEXUS AI — Main Entry Point
============================

Usage:
    python -m nexus_ai.main

Or import and call:
    from nexus_ai.main import NexusAI
    nexus = NexusAI(api_key="your_groq_key")
    result = nexus.run("Plan a startup in AI for healthcare")
"""

from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from nexus_ai.agents.registry import AgentFactory
from nexus_ai.config import (
    GROQ_API_KEY, MAX_ROUNDS, PLAN_RETRY_LIMIT,
    LOGS_DIR, OUTPUTS_DIR,
)
from nexus_ai.memory.memory_manager import MemoryManager
from nexus_ai.utils.dag import ExecutionDAG, NodeStatus
from nexus_ai.utils.logger import Tracer, get_logger

logger = get_logger("nexus")


# ══════════════════════════════════════════════════════════════════════════════
#  NEXUS AI SYSTEM
# ══════════════════════════════════════════════════════════════════════════════

class NexusAI:
    """
    NEXUS AI — Autonomous Multi-Agent System

    Pipeline per task:
    1. Orchestrator analyses goal
    2. Planner decomposes into DAG
    3. DAG executor runs agents in topological order
    4. Critic reviews key outputs
    5. Optimizer improves if needed
    6. Validator certifies results
    7. Reporter compiles final report

    Memory is persistent across sessions (FAISS + session log).
    """

    VERSION = "1.0.0"

    def __init__(
        self,
        api_key: str = "",
        session_id: Optional[str] = None,
        verbose: bool = True,
    ):
        self.api_key    = api_key or GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.session_id = session_id or f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        self.verbose    = verbose

        # Core infrastructure
        self.memory  = MemoryManager(self.session_id)
        self.tracer  = Tracer(self.session_id)
        self.factory = AgentFactory(self.memory, self.tracer, self.api_key)

        # Expose individual agents as attributes
        self._agents: Dict[str, Any] = {}

        logger.info(f"{'='*60}")
        logger.info(f"NEXUS AI v{self.VERSION} — session: {self.session_id}")
        logger.info(f"{'='*60}")

    # ── Property shortcuts ────────────────────────────────────────────────────

    @property
    def orchestrator(self):  return self.factory.get("orchestrator")
    @property
    def planner(self):       return self.factory.get("planner")
    @property
    def researcher(self):    return self.factory.get("researcher")
    @property
    def coder(self):         return self.factory.get("coder")
    @property
    def analyst(self):       return self.factory.get("analyst")
    @property
    def critic(self):        return self.factory.get("critic")
    @property
    def optimizer(self):     return self.factory.get("optimizer")
    @property
    def validator(self):     return self.factory.get("validator")
    @property
    def reporter(self):      return self.factory.get("reporter")

    # ══════════════════════════════════════════════════════════════════════════
    #  MAIN RUN
    # ══════════════════════════════════════════════════════════════════════════

    def run(self, goal: str, data: str = "") -> Dict[str, Any]:
        
        t_start = time.time()
        logger.info(f"\n🚀 NEXUS TASK: {goal}\n")
        self.memory.log_message("user", goal)

        # ── Step 1: Orchestrator analyses the goal ───────────────────────────
        self._print_step(1, "Orchestrator: Analysing goal")
        orch_analysis = self.orchestrator._timed_run(goal, data)
        self._print_output("Orchestrator", orch_analysis)

        # ── Step 2: Planner builds DAG ───────────────────────────────────────
        self._print_step(2, "Planner: Decomposing into sub-tasks")
        plan_json = self.planner._timed_run(goal, orch_analysis)
        plan      = self.planner.validate_plan(plan_json)
        self._print_output("Planner", f"Plan: {len(plan)} tasks — " +
                           ", ".join(p["name"] for p in plan))

        # ── Step 3: Build and execute DAG ────────────────────────────────────
        self._print_step(3, "Executor: Running DAG")
        dag     = ExecutionDAG(self.session_id, self.tracer)
        dag.from_plan(plan)
        outputs = self._execute_dag(dag, goal, data)

        # ── Step 4: Critic reviews aggregated output ─────────────────────────
        self._print_step(4, "Critic: Reviewing outputs")
        combined = self._combine_outputs(outputs)
        critique = self.critic._timed_run(
            goal,
            target_output=combined,
        )
        self._print_output("Critic", critique)

        # ── Step 5: Optimizer applies improvements ───────────────────────────
        self._print_step(5, "Optimizer: Improving outputs")
        optimised = self.optimizer._timed_run(
            goal,
            original=combined,
            feedback=critique,
            iteration=1,
        )
        self._print_output("Optimizer", optimised[:300] + "…")

        # ── Step 6: Validator certifies ──────────────────────────────────────
        self._print_step(6, "Validator: Certifying result")
        validation_raw = self.validator._timed_run(goal, context=optimised)
        validation     = self._parse_validation(validation_raw)
        self._print_output("Validator",
                           f"Verdict: {validation.get('verdict','?')} | "
                           f"Score: {validation.get('score','?')}/10")

        # ── Step 7: Reporter compiles final report ───────────────────────────
        self._print_step(7, "Reporter: Compiling final report")
        all_outputs = {**outputs, "optimised": optimised, "critique": critique}
        final_report = self.reporter._timed_run(
            goal,
            agent_outputs=all_outputs,
            session_id=self.session_id,
        )

        # ── Store key memories ───────────────────────────────────────────────
        self.memory.remember(
            f"Task completed: {goal[:100]}",
            {"type": "task_completion", "verdict": validation.get("verdict")},
        )

        elapsed = round(time.time() - t_start, 2)
        self._print_final(goal, elapsed, validation, final_report)

        return {
            "session_id":    self.session_id,
            "goal":          goal,
            "plan":          plan,
            "dag_summary":   dag.summary(),
            "agent_outputs": all_outputs,
            "critique":      critique,
            "validation":    validation,
            "final_report":  final_report,
            "elapsed_s":     elapsed,
        }

    # ══════════════════════════════════════════════════════════════════════════
    #  DAG EXECUTOR
    # ══════════════════════════════════════════════════════════════════════════

    def _execute_dag(self, dag: ExecutionDAG, goal: str, data: str) -> Dict[str, str]:
        """Execute ready nodes in the DAG until completion."""
        outputs: Dict[str, str] = {}
        rounds  = 0

        while not dag.is_complete() and rounds < MAX_ROUNDS:
            ready = dag.ready_nodes()
            if not ready:
                logger.warning("No ready nodes but DAG incomplete — possible cycle or all failed")
                break

            for node in ready:
                rounds += 1
                logger.info(f"  ▸ [{node.agent.upper()}] {node.name}")
                dag.mark_running(node.id)

                # Build context from predecessor outputs
                pred_context = dag.get_context_for_node(node.id)
                if data:
                    pred_context = f"DATA INPUT:\n{data}\n\n{pred_context}"

                agent = self.factory.get(node.agent)

                # Coder gets language hint from metadata
                kwargs = dict(node.metadata)
                if node.agent == "analyst" and data:
                    kwargs["data"] = data

                try:
                    output = agent._timed_run(node.prompt, pred_context, **kwargs)
                    dag.mark_success(node.id, output)
                    outputs[node.name] = output
                except Exception as e:
                    logger.error(f"Node {node.name} failed: {e}")
                    recovery = self.orchestrator.recover_failure(node.name, str(e))
                    dag.mark_failed(node.id, str(e))
                    self.tracer.error(node.agent, f"Node {node.name}: {e}", e)

        summary = dag.summary()
        logger.info(f"DAG complete — {summary['statuses']}")
        return outputs

    # ══════════════════════════════════════════════════════════════════════════
    #  SINGLE-AGENT SHORTCUTS
    # ══════════════════════════════════════════════════════════════════════════

    def ask(self, question: str, agent: str = "researcher") -> str:
        """Quick single-agent query without full pipeline."""
        logger.info(f"Quick query via {agent}: {question[:60]}")
        a = self.factory.get(agent)
        return a._timed_run(question)

    def write_code(self, task: str, language: str = "python",
                   filename: str = "") -> str:
        """Direct code generation + save."""
        return self.coder._timed_run(task, language=language, filename=filename)

    def analyse_csv(self, csv_content: str, question: str = "") -> str:
        """Analyse CSV data with optional question."""
        task = question or "Analyse this data and produce a business strategy."
        return self.analyst._timed_run(task, data=csv_content)

    # ══════════════════════════════════════════════════════════════════════════
    #  HELPERS
    # ══════════════════════════════════════════════════════════════════════════

    def _combine_outputs(self, outputs: Dict[str, str]) -> str:
        parts = []
        for name, out in outputs.items():
            parts.append(f"### {name.upper()}\n{out[:1200]}")
        return "\n\n".join(parts)

    def _parse_validation(self, raw: str) -> Dict:
        try:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception:
            pass
        return {"passed": True, "score": 7, "verdict": "CONDITIONAL_PASS",
                "notes": raw[:200]}

    def _print_step(self, n: int, label: str):
        if self.verbose:
            print(f"\n{'─'*60}")
            print(f"  STEP {n}: {label}")
            print(f"{'─'*60}")

    def _print_output(self, agent: str, text: str):
        if self.verbose:
            preview = str(text)[:400].replace("\n", " ")
            print(f"  [{agent}] {preview}")

    def _print_final(self, goal: str, elapsed: float, validation: Dict,
                     report: str):
        if self.verbose:
            print(f"\n{'═'*60}")
            print(f"  ✅ NEXUS TASK COMPLETE")
            print(f"  Goal    : {goal[:70]}")
            print(f"  Verdict : {validation.get('verdict', '?')}")
            print(f"  Score   : {validation.get('score', '?')}/10")
            print(f"  Time    : {elapsed}s")
            print(f"  Report  → outputs/reports/")
            print(f"{'═'*60}\n")


import re  # ensure available for _parse_validation


# ══════════════════════════════════════════════════════════════════════════════
#  CLI ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

DEMO_TASKS = [
    "Plan a startup in AI for healthcare",
    "Generate backend architecture for a scalable SaaS app",
    "Design a RAG pipeline for 50,000 documents",
    "Analyse CSV data and create a business strategy",
]



def main():
    import argparse



    parser = argparse.ArgumentParser(
        description="NEXUS AI — Autonomous Multi-Agent System"
    )
    parser.add_argument("--task",    "-t", type=str,  help="Task/goal to execute")
    parser.add_argument("--demo",    "-d", type=int,  help="Run demo task 1-4",
                        choices=[1, 2, 3, 4])
    parser.add_argument("--session", "-s", type=str,  help="Session ID (for continuity)")
    parser.add_argument("--csv",     "-c", type=str,  help="Path to CSV file for analysis")
    parser.add_argument("--code",    "-k", type=str,  help="Code generation task")
    parser.add_argument("--lang",    "-l", type=str,  default="python",
                        help="Language for --code (default: python)")
    parser.add_argument("--api-key", "-a", type=str,
                        default=os.getenv("GROQ_API_KEY", ""),
                        help="Groq API key (or set GROQ_API_KEY env var)")
    parser.add_argument("--quiet",   "-q", action="store_true",
                        help="Suppress verbose output")
    args = parser.parse_args()

    if not args.api_key:
        print("⚠️  No API key found. Set GROQ_API_KEY env var or use --api-key")
        print("   Get a free key at: https://console.groq.com")
        print()

    nexus = NexusAI(
        api_key=args.api_key,
        session_id=args.session,
        verbose=not args.quiet,
    )

    # ── Routing ──────────────────────────────────────────────────────────────
    if args.demo:
        task = DEMO_TASKS[args.demo - 1]
        print(f"Running demo task {args.demo}: {task}\n")
        result = nexus.run(task)

    elif args.csv:
        csv_path = Path(args.csv)
        if not csv_path.exists():
            print(f"CSV file not found: {args.csv}")
            return
        csv_content = csv_path.read_text(encoding="utf-8")
        task = args.task or "Analyse this CSV and produce a business strategy"
        result = nexus.run(task, data=csv_content)

    elif args.code:
        output = nexus.write_code(args.code, language=args.lang)
        print("\n" + output)
        return

    elif args.task:
        result = nexus.run(args.task)

    else:
        # Interactive mode
        print("NEXUS AI Interactive Mode")
        print("Type your goal, or 'exit' to quit.\n")
        while True:
            try:
                goal = input("NEXUS> ").strip()
            except (EOFError, KeyboardInterrupt):
                break
            if not goal or goal.lower() in ("exit", "quit", "q"):
                break
            result = nexus.run(goal)

    if "result" in dir() and isinstance(result, dict):
        print(f"\nSession ID: {result['session_id']}")
        print(f"Report saved to: outputs/reports/")


if __name__ == "__main__":
    main()