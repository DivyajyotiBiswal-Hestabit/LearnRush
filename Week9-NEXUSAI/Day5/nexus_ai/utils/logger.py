import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

def _cfg():
    from nexus_ai.config import LOG_LEVEL, LOG_FILE, TRACE_FILE
    return LOG_LEVEL, LOG_FILE, TRACE_FILE


def get_logger(name: str = "nexus") -> logging.Logger:
    """Return (or create) a named logger with file + console handlers."""
    LOG_LEVEL, LOG_FILE, _ = _cfg()

    logger = logging.getLogger(name)
    if logger.handlers:
        return logger                        # already configured

    logger.setLevel(getattr(logging, LOG_LEVEL, logging.DEBUG))

    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)-18s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # File
    Path(LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    return logger


class Tracer:
    """Append-only JSONL tracer — one record per agent event."""

    def __init__(self, session_id: str):
        _, _, TRACE_FILE = _cfg()
        self.session_id = session_id
        self.path = Path(TRACE_FILE)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._log = get_logger("tracer")

    def _write(self, record: Dict[str, Any]) -> None:
        record.update(
            session_id=self.session_id,
            ts=datetime.utcnow().isoformat() + "Z",
        )
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

    def task_start(self, agent: str, task: str, metadata: Optional[Dict] = None):
        self._write({"event": "TASK_START", "agent": agent, "task": task,
                     "meta": metadata or {}})
        self._log.debug(f"[{agent}] START — {task[:80]}")

    def task_end(self, agent: str, task: str, status: str,
                 duration_s: float, output_preview: str = ""):
        self._write({"event": "TASK_END", "agent": agent, "task": task,
                     "status": status, "duration_s": round(duration_s, 3),
                     "output_preview": output_preview[:200]})
        emoji = "✅" if status == "success" else "❌"
        self._log.info(f"[{agent}] {emoji} {status.upper()} ({duration_s:.1f}s) — {task[:60]}")

    def agent_message(self, sender: str, receiver: str, content: str):
        self._write({"event": "MSG", "from": sender, "to": receiver,
                     "content_len": len(content), "preview": content[:150]})

    def memory_event(self, event_type: str, query: str, hits: int):
        self._write({"event": f"MEMORY_{event_type.upper()}", "query": query[:100],
                     "hits": hits})

    def dag_event(self, event_type: str, node_id: str, details: Dict = None):
        self._write({"event": f"DAG_{event_type.upper()}", "node": node_id,
                     "details": details or {}})

    def error(self, agent: str, message: str, exc: Optional[Exception] = None):
        self._write({"event": "ERROR", "agent": agent, "message": message,
                     "exc": str(exc) if exc else None})
        self._log.error(f"[{agent}] ERROR — {message}")

    def reflection(self, agent: str, score: float, feedback: str):
        self._write({"event": "REFLECTION", "agent": agent, "score": score,
                     "feedback": feedback[:300]})
        self._log.info(f"[{agent}] REFLECTION score={score:.2f}")