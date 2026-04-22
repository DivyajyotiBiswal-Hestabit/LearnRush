from __future__ import annotations
import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from nexus_ai.agents.base_agent import BaseAgent
from nexus_ai.config import (
    ORCHESTRATOR_MODEL, CRITIC_MODEL, CODER_MODEL,
    CODE_OUTPUT_DIR, REPORT_OUTPUT_DIR,
    MAX_PLAN_DEPTH,
)
from nexus_ai.memory.memory_manager import MemoryManager
from nexus_ai.utils.logger import Tracer, get_logger

logger = get_logger("agents")

#  1. ORCHESTRATOR

class OrchestratorAgent(BaseAgent):
    """
    Master controller: decides which agents to invoke, in what order,
    monitors DAG progress, and handles failure recovery.
    """
    name  = "orchestrator"
    model = ORCHESTRATOR_MODEL

    def run(self, task: str, context: str = "", **kwargs) -> str:
        system = self._build_system(task)
        user   = f"""You are the NEXUS Orchestrator. A user has submitted the following high-level goal.
Analyse it and decide which agents are needed and what the overall execution strategy should be.

GOAL: {task}

PRIOR CONTEXT:
{context or 'None'}

Respond with:
1. Brief analysis of the goal
2. Recommended agent sequence
3. Key risks / considerations
4. Expected outputs
"""
        return self._call_llm(system, user)

    def decide_next(self, dag_summary: Dict, history: str) -> str:
        """Given DAG state, decide the next action."""
        prompt = f"""DAG STATE:
{json.dumps(dag_summary, indent=2)}

RECENT HISTORY:
{history}

As Orchestrator, decide the next action:
- CONTINUE if more nodes are ready
- RETRY <node_id> if a node should be retried
- RECOVER <strategy> if something is broken
- COMPLETE if the task is done
- ABORT <reason> if the task cannot proceed

Reply in ONE LINE starting with the action keyword."""
        return self._call_llm(self._build_system(), prompt)

    def recover_failure(self, failed_node: str, reason: str) -> str:
        """Generate a recovery strategy for a failed node."""
        prompt = f"""Node '{failed_node}' failed with reason: {reason}
Suggest a concrete recovery strategy (max 3 sentences)."""
        return self._call_llm(self._build_system(), prompt)

#  2. PLANNER

class PlannerAgent(BaseAgent):
    """
    Decomposes a goal into an ordered list of sub-tasks suitable
    for DAG execution.  Returns validated JSON.
    """
    name = "planner"

    # Valid agent names as a constant for the prompt
    _VALID_AGENTS = (
        "researcher, coder, analyst, critic, optimizer, validator, reporter"
    )

    def run(self, task: str, context: str = "", **kwargs) -> str:
        system = self._build_system(task)
        user   = f"""Decompose the following goal into {MAX_PLAN_DEPTH} or fewer concrete sub-tasks.

GOAL: {task}
CONTEXT: {context or 'None'}

VALID AGENT VALUES (use EXACTLY one of these strings, nothing else):
  researcher | coder | analyst | critic | optimizer | validator | reporter

CRITICAL RULES:
- The "agent" field MUST be one of the 7 strings listed above — verbatim, lowercase
- Do NOT invent agent names like "idea generator" or "market researcher" — use "researcher"
- Do NOT use "orchestrator" or "planner" as agents in the plan
- deps must reference task names defined earlier in the array
- first task always has deps: []
- task names must be snake_case with no spaces

Return ONLY a valid JSON array — no markdown fences, no explanation, no extra text:
[
  {{
    "name": "unique_snake_case_name",
    "agent": "researcher",
    "prompt": "detailed instruction",
    "deps": []
  }},
  ...
]
"""
        raw = self._call_llm(system, user)
        return self._clean_json(raw)

    def _clean_json(self, text: str) -> str:
        """Strip markdown fences and return clean JSON string."""
        text = re.sub(r"```(?:json)?", "", text).strip().strip("`")
        match = re.search(r"\[.*\]", text, re.DOTALL)
        return match.group() if match else text

    def validate_plan(self, plan_json: str) -> List[Dict]:
        """Parse and validate plan JSON; return list of dicts."""
        try:
            plan = json.loads(plan_json)
            assert isinstance(plan, list) and len(plan) > 0
            for item in plan:
                assert "name" in item and "agent" in item and "prompt" in item
            return plan
        except Exception as e:
            logger.warning(f"Plan validation failed: {e} — returning fallback plan")
            return [{"name": "fallback_research", "agent": "researcher",
                     "prompt": plan_json[:300], "deps": []}]


#  3. RESEARCHER

class ResearcherAgent(BaseAgent):
    """
    Synthesises knowledge on a topic.  Produces structured research summaries.
    """
    name = "researcher"

    def run(self, task: str, context: str = "", **kwargs) -> str:
        system = self._build_system(task)
        user   = f"""You are a world-class research analyst.

RESEARCH TASK: {task}

PREDECESSOR OUTPUTS:
{context or 'None'}

Provide a comprehensive, structured response covering:
1. Key facts and concepts
2. Current state / industry landscape
3. Key players / technologies
4. Challenges and opportunities
5. Concrete data points and examples

Be specific, factual, and thorough.  Use markdown headings."""
        return self._call_llm(system, user, max_tokens=2048)

    def _call_llm(self, system, user, **kw):
        return self._llm.system_user(system, user, **kw)


#  4. CODER

class CoderAgent(BaseAgent):
    """
    Writes, refines, and SAVES production-quality code to disk.
    """
    name  = "coder"
    model = CODER_MODEL

    def run(self, task: str, context: str = "", **kwargs) -> str:
        language = kwargs.get("language", "python")
        filename = kwargs.get("filename", "")

        system = self._build_system(task)
        user   = f"""You are an expert software engineer.

CODING TASK: {task}

CONTEXT FROM PREVIOUS AGENTS:
{context or 'None'}

Write complete, production-ready {language} code.
Include:
- Module docstring
- Type hints
- Error handling
- Inline comments for complex logic
- A brief usage example at the bottom (in __main__ or comments)

Return ONLY the code, no extra prose."""

        code = self._call_llm(system, user, max_tokens=3000)
        code = self._strip_fences(code, language)

        saved_path = self._save_code(code, task, language, filename)
        header = f"# Saved to: {saved_path}\n\n"
        return header + code

    def _strip_fences(self, text: str, lang: str) -> str:
        text = re.sub(rf"```{lang}", "", text, flags=re.IGNORECASE)
        text = re.sub(r"```", "", text)
        return text.strip()

    def _save_code(self, code: str, task: str, lang: str, filename: str = "") -> str:
        ext_map = {"python": "py", "javascript": "js", "typescript": "ts",
                   "bash": "sh", "sql": "sql", "yaml": "yaml",
                   "json": "json", "rust": "rs", "go": "go"}
        ext = ext_map.get(lang.lower(), "txt")

        if not filename:
            # Derive filename from task
            slug = re.sub(r"[^a-z0-9]+", "_", task.lower())[:40].strip("_")
            filename = f"{slug}.{ext}"
        elif not filename.endswith(f".{ext}"):
            filename = f"{filename}.{ext}"

        out_path = Path(CODE_OUTPUT_DIR) / filename
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(code, encoding="utf-8")
        logger.info(f"Code saved → {out_path}")
        return str(out_path)

    def _call_llm(self, system, user, **kw):
        return self._llm.system_user(system, user, **kw)

#  5. ANALYST

class AnalystAgent(BaseAgent):
    """
    Processes data (CSV, text, JSON), identifies patterns,
    produces business insights and strategy recommendations.
    """
    name = "analyst"

    def run(self, task: str, context: str = "", **kwargs) -> str:
        data_ref = kwargs.get("data", "")

        system = self._build_system(task)
        user   = f"""You are a senior data and business analyst.

ANALYSIS TASK: {task}

DATA / INPUT:
{data_ref or 'No explicit data provided. Use context below.'}

CONTEXT:
{context or 'None'}

Provide a rigorous analysis including:
## Executive Summary
## Data Observations & Patterns
## Key Metrics
## Business Implications
## Strategic Recommendations (with priorities)
## Risks & Mitigation
## Next Steps

Be quantitative where possible; cite assumptions."""
        return self._call_llm(system, user, max_tokens=2048)

    def _call_llm(self, system, user, **kw):
        return self._llm.system_user(system, user, **kw)


#  6. CRITIC

class CriticAgent(BaseAgent):
    """
    Reviews outputs from other agents; identifies gaps, errors, biases.
    Returns structured critique with quality score.
    """
    name  = "critic"
    model = CRITIC_MODEL

    def run(self, task: str, context: str = "", **kwargs) -> str:
        target_output = kwargs.get("target_output", context)

        system = self._build_system(task)
        user   = f"""You are a rigorous expert critic and quality reviewer.

ORIGINAL TASK: {task}

OUTPUT TO REVIEW:
{target_output[:3000] if target_output else context[:3000]}

Critically evaluate this output:

## Quality Score: X/10
## Strengths
## Weaknesses & Gaps
## Factual Accuracy Concerns
## Completeness
## Specific Improvement Actions (numbered list)
## Verdict: [ACCEPT / REVISE / REJECT]

Be direct, specific, and actionable."""
        return self._call_llm(system, user, max_tokens=1500)

    def _call_llm(self, system, user, **kw):
        return self._llm.system_user(system, user, **kw)


#  7. OPTIMIZER

class OptimizerAgent(BaseAgent):
    """
    Takes critic feedback and original output; produces an improved version.
    Implements the self-improvement loop.
    """
    name = "optimizer"

    def run(self, task: str, context: str = "", **kwargs) -> str:
        original   = kwargs.get("original",  context)
        feedback   = kwargs.get("feedback",  "Improve quality and completeness.")
        iteration  = kwargs.get("iteration", 1)

        system = self._build_system(task)
        user   = f"""You are an expert optimizer performing improvement iteration {iteration}.

ORIGINAL TASK: {task}

CRITIC FEEDBACK:
{feedback}

ORIGINAL OUTPUT:
{original[:2500]}

Produce an improved version that:
1. Addresses every criticism
2. Keeps all correct / good content
3. Adds missing details
4. Fixes inaccuracies

Output ONLY the improved content, clearly structured."""
        return self._call_llm(system, user, max_tokens=3000)

    def _call_llm(self, system, user, **kw):
        return self._llm.system_user(system, user, **kw)


#  8. VALIDATOR

class ValidatorAgent(BaseAgent):
    """
    Final gate: verifies outputs meet task requirements.
    For code: checks syntax / logic.  For docs: checks completeness.
    """
    name = "validator"

    def run(self, task: str, context: str = "", **kwargs) -> str:
        output_type = kwargs.get("output_type", "general")

        system = self._build_system(task)
        user   = f"""You are a strict output validator.

ORIGINAL TASK: {task}
OUTPUT TYPE: {output_type}

OUTPUT TO VALIDATE:
{context[:3000]}

Run the following checks:
1. Task alignment — does output directly address the task?
2. Completeness — are all required sections present?
3. Correctness — any obvious errors or contradictions?
4. Actionability — are next steps clear and concrete?
5. Quality threshold — is this production-ready?

Return ONLY valid JSON:
{{
  "passed": true/false,
  "score": 0-10,
  "checks": {{"task_alignment": true/false, "completeness": true/false, "correctness": true/false, "actionability": true/false, "quality": true/false}},
  "issues": ["issue1", "issue2"],
  "verdict": "PASS / CONDITIONAL_PASS / FAIL",
  "notes": "brief summary"
}}"""
        raw = self._call_llm(system, user)
        try:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            return match.group() if match else raw
        except Exception:
            return raw

    def _call_llm(self, system, user, **kw):
        return self._llm.system_user(system, user, **kw)

#  9. REPORTER

class ReporterAgent(BaseAgent):
    """
    Compiles all agent outputs into a polished final report
    and saves it to outputs/reports/.
    """
    name = "reporter"

    def run(self, task: str, context: str = "", **kwargs) -> str:
        agent_outputs = kwargs.get("agent_outputs", {})
        session_id    = kwargs.get("session_id", "unknown")

        # Build combined context
        combined = context
        if agent_outputs:
            sections = []
            for agent_name, output in agent_outputs.items():
                sections.append(f"### {agent_name.upper()} OUTPUT\n{output}")
            combined = "\n\n".join(sections)

        system = self._build_system(task)
        user   = f"""You are an elite executive report writer.

ORIGINAL TASK: {task}

ALL AGENT OUTPUTS:
{combined[:6000]}

Compile a comprehensive final report:

# NEXUS AI — FINAL REPORT
**Task:** {task}
**Session:** {session_id}

## 1. Executive Summary
## 2. Research Findings
## 3. Technical Architecture / Implementation
## 4. Data Analysis & Insights
## 5. Strategic Recommendations
## 6. Implementation Roadmap
## 7. Risk Assessment
## 8. Conclusion & Next Steps

---
*Generated by NEXUS AI Multi-Agent System*

Write in professional, executive-level language. Be specific and actionable."""

        report = self._call_llm(system, user, max_tokens=4000)
        saved  = self._save_report(report, task, session_id)
        header = f"<!-- Report saved to: {saved} -->\n\n"
        return header + report

    def _save_report(self, report: str, task: str, session_id: str) -> str:
        from datetime import datetime
        slug     = re.sub(r"[^a-z0-9]+", "_", task.lower())[:40].strip("_")
        ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"report_{slug}_{ts}.md"
        out_path = Path(REPORT_OUTPUT_DIR) / filename
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(report, encoding="utf-8")
        logger.info(f"Report saved → {out_path}")
        return str(out_path)

    def _call_llm(self, system, user, **kw):
        return self._llm.system_user(system, user, **kw)