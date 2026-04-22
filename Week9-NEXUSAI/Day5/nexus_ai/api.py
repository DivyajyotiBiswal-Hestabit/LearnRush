from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

_root = Path(__file__).parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field

from nexus_ai.main import NexusAI
from nexus_ai.config import (
    AGENT_ROLES, LOGS_DIR, REPORT_OUTPUT_DIR,
    CODE_OUTPUT_DIR, SESSION_LOG_PATH, GROQ_API_KEY,
)
from nexus_ai.memory.memory_manager import MemoryManager, SessionStore

app = FastAPI(
    title="NEXUS AI API",
    description="Autonomous Multi-Agent AI System — REST Interface",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_nexus_cache: Dict[str, NexusAI] = {}

def get_nexus(api_key: str = "", session_id: str = "") -> NexusAI:
    key = api_key or GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    sid = session_id or f"api_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    if sid not in _nexus_cache:
        _nexus_cache[sid] = NexusAI(api_key=key, session_id=sid, verbose=False)
    return _nexus_cache[sid]



class RunRequest(BaseModel):
    goal:       str            = Field(..., description="The task/goal to execute")
    data:       str            = Field("",  description="Optional CSV or raw data input")
    session_id: Optional[str]  = Field(None, description="Resume a previous session")
    api_key:    Optional[str]  = Field(None, description="Groq API key (overrides env)")

class AskRequest(BaseModel):
    question:   str            = Field(..., description="Question to ask")
    agent:      str            = Field("researcher", description="Agent to use")
    session_id: Optional[str]  = Field(None)
    api_key:    Optional[str]  = Field(None)

class CodeRequest(BaseModel):
    task:       str            = Field(..., description="Code generation task")
    language:   str            = Field("python", description="Programming language")
    filename:   str            = Field("", description="Output filename (optional)")
    session_id: Optional[str]  = Field(None)
    api_key:    Optional[str]  = Field(None)

class AnalyseRequest(BaseModel):
    csv_content: str           = Field(..., description="CSV content as string")
    question:    str           = Field("", description="Analysis question")
    session_id:  Optional[str] = Field(None)
    api_key:     Optional[str] = Field(None)

class RecallRequest(BaseModel):
    query:      str            = Field(..., description="Similarity search query")
    k:          int            = Field(5,   description="Number of results")
    session_id: Optional[str]  = Field(None)
    api_key:    Optional[str]  = Field(None)



@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "groq_key_set": bool(GROQ_API_KEY or os.getenv("GROQ_API_KEY")),
    }



@app.get("/agents")
def list_agents():
    return {"agents": [
        {"name": name, "role": role}
        for name, role in AGENT_ROLES.items()
    ]}



@app.post("/run")
def run_pipeline(req: RunRequest):
    """Execute the full 7-step NEXUS pipeline. Returns complete result."""
    try:
        nexus = get_nexus(req.api_key or "", req.session_id or "")
        result = nexus.run(req.goal, req.data)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/stream")
async def run_pipeline_stream(req: RunRequest):
    """
    Execute the full pipeline with Server-Sent Events (SSE) streaming.
    Each step emits a JSON event as it completes.
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        def emit(event: str, data: Any) -> str:
            return f"data: {json.dumps({'event': event, 'data': data})}\n\n"

        try:
            api_key    = req.api_key or GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
            session_id = req.session_id or f"stream_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            yield emit("start", {"session_id": session_id, "goal": req.goal})

            nexus = NexusAI(api_key=api_key, session_id=session_id, verbose=False)

            loop = asyncio.get_event_loop()

            # Step 1 — Orchestrator
            yield emit("step", {"step": 1, "name": "Orchestrator", "status": "running"})
            orch = await loop.run_in_executor(None, lambda: nexus.orchestrator._timed_run(req.goal, req.data))
            yield emit("step", {"step": 1, "name": "Orchestrator", "status": "done", "preview": orch[:300]})

            # Step 2 — Planner
            yield emit("step", {"step": 2, "name": "Planner", "status": "running"})
            plan_json = await loop.run_in_executor(None, lambda: nexus.planner._timed_run(req.goal, orch))
            plan      = nexus.planner.validate_plan(plan_json)
            yield emit("step", {"step": 2, "name": "Planner", "status": "done",
                                "plan": [p["name"] for p in plan]})

            # Step 3 — DAG Execution
            yield emit("step", {"step": 3, "name": "DAG Executor", "status": "running"})
            from nexus_ai.utils.dag import ExecutionDAG
            dag = ExecutionDAG(session_id, nexus.tracer)
            dag.from_plan(plan)

            outputs: Dict[str, str] = {}
            from nexus_ai.config import MAX_ROUNDS
            rounds = 0
            while not dag.is_complete() and rounds < MAX_ROUNDS:
                ready = dag.ready_nodes()
                if not ready:
                    break
                for node in ready:
                    rounds += 1
                    yield emit("node", {"name": node.name, "agent": node.agent, "status": "running"})
                    dag.mark_running(node.id)
                    pred_context = dag.get_context_for_node(node.id)
                    if req.data:
                        pred_context = f"DATA INPUT:\n{req.data}\n\n{pred_context}"
                    agent  = nexus.factory.get(node.agent)
                    kwargs = dict(node.metadata)
                    try:
                        out = await loop.run_in_executor(
                            None, lambda a=agent, p=node.prompt, c=pred_context, k=kwargs:
                            a._timed_run(p, c, **k)
                        )
                        dag.mark_success(node.id, out)
                        outputs[node.name] = out
                        yield emit("node", {"name": node.name, "agent": node.agent,
                                            "status": "done", "preview": out[:200]})
                    except Exception as e:
                        dag.mark_failed(node.id, str(e))
                        yield emit("node", {"name": node.name, "agent": node.agent,
                                            "status": "failed", "error": str(e)})

            yield emit("step", {"step": 3, "name": "DAG Executor", "status": "done",
                                "dag_summary": dag.summary()})

            # Steps 4-7 — Critic, Optimizer, Validator, Reporter
            steps = [
                (4, "Critic",    lambda: nexus.critic._timed_run(req.goal, target_output=nexus._combine_outputs(outputs))),
                (5, "Optimizer", None),  # depends on critic
                (6, "Validator", None),  # depends on optimizer
                (7, "Reporter",  None),  # depends on validator
            ]

            combined  = nexus._combine_outputs(outputs)

            yield emit("step", {"step": 4, "name": "Critic", "status": "running"})
            critique = await loop.run_in_executor(None, lambda: nexus.critic._timed_run(req.goal, target_output=combined))
            yield emit("step", {"step": 4, "name": "Critic", "status": "done", "preview": critique[:300]})

            yield emit("step", {"step": 5, "name": "Optimizer", "status": "running"})
            optimised = await loop.run_in_executor(None, lambda: nexus.optimizer._timed_run(req.goal, original=combined, feedback=critique, iteration=1))
            yield emit("step", {"step": 5, "name": "Optimizer", "status": "done", "preview": optimised[:300]})

            yield emit("step", {"step": 6, "name": "Validator", "status": "running"})
            val_raw    = await loop.run_in_executor(None, lambda: nexus.validator._timed_run(req.goal, context=optimised))
            validation = nexus._parse_validation(val_raw)
            yield emit("step", {"step": 6, "name": "Validator", "status": "done", "validation": validation})

            yield emit("step", {"step": 7, "name": "Reporter", "status": "running"})
            all_outputs = {**outputs, "optimised": optimised, "critique": critique}
            report      = await loop.run_in_executor(None, lambda: nexus.reporter._timed_run(req.goal, agent_outputs=all_outputs, session_id=session_id))
            yield emit("step", {"step": 7, "name": "Reporter", "status": "done", "preview": report[:400]})

            yield emit("complete", {
                "session_id":   session_id,
                "validation":   validation,
                "final_report": report,
                "dag_summary":  dag.summary(),
            })

        except Exception as e:
            yield emit("error", {"message": str(e)})

    return StreamingResponse(event_generator(), media_type="text/event-stream")



@app.post("/ask")
def ask_agent(req: AskRequest):
    try:
        nexus  = get_nexus(req.api_key or "", req.session_id or "")
        answer = nexus.ask(req.question, agent=req.agent)
        return {"status": "success", "agent": req.agent, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/code")
def generate_code(req: CodeRequest):
    try:
        nexus  = get_nexus(req.api_key or "", req.session_id or "")
        output = nexus.write_code(req.task, language=req.language, filename=req.filename)
        return {"status": "success", "output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyse")
def analyse_csv(req: AnalyseRequest):
    try:
        nexus  = get_nexus(req.api_key or "", req.session_id or "")
        result = nexus.analyse_csv(req.csv_content, question=req.question)
        return {"status": "success", "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), question: str = ""):
    content = await file.read()
    try:
        csv_str = content.decode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode file as UTF-8 text")
    nexus  = get_nexus()
    result = nexus.analyse_csv(csv_str, question=question)
    return {"status": "success", "filename": file.filename, "analysis": result}


@app.get("/memory/recall")
def recall_memory(query: str = Query(...), k: int = Query(5)):
    try:
        mm   = MemoryManager("api_recall")
        hits = mm.recall(query, k=k)
        return {"status": "success", "query": query, "hits": hits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/sessions")
def list_sessions():
    try:
        store    = SessionStore()
        sessions = store.all_sessions()
        return {"sessions": sessions, "count": len(sessions)}
    except Exception:
        return {"sessions": [], "count": 0}


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    try:
        store   = SessionStore()
        history = store.get(session_id)
        return {"session_id": session_id, "history": history, "turns": len(history)}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))



@app.get("/outputs/reports")
def list_reports():
    p = Path(REPORT_OUTPUT_DIR)
    files = sorted(p.glob("*.md"), key=lambda f: f.stat().st_mtime, reverse=True)
    return {"reports": [{"name": f.name, "size_bytes": f.stat().st_size,
                         "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat()}
                        for f in files]}


@app.get("/outputs/reports/{filename}")
def get_report(filename: str):
    p = Path(REPORT_OUTPUT_DIR) / filename
    if not p.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(str(p), media_type="text/markdown", filename=filename)


@app.get("/outputs/code")
def list_code_files():
    p = Path(CODE_OUTPUT_DIR)
    files = sorted(p.glob("*"), key=lambda f: f.stat().st_mtime, reverse=True)
    return {"files": [{"name": f.name, "size_bytes": f.stat().st_size,
                       "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat()}
                      for f in files if f.is_file()]}


@app.get("/outputs/code/{filename}")
def get_code_file(filename: str):
    p = Path(CODE_OUTPUT_DIR) / filename
    if not p.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(p), media_type="text/plain", filename=filename)



@app.get("/logs")
def get_logs(lines: int = Query(100, description="Number of recent lines to return")):
    log_path = Path(LOGS_DIR) / "nexus.log"
    if not log_path.exists():
        return {"lines": []}
    with open(log_path, encoding="utf-8", errors="replace") as f:
        all_lines = f.readlines()
    return {"lines": [l.rstrip() for l in all_lines[-lines:]]}


@app.get("/logs/trace")
def get_trace(lines: int = Query(50)):
    trace_path = Path(LOGS_DIR) / "trace.jsonl"
    if not trace_path.exists():
        return {"events": []}
    events = []
    with open(trace_path, encoding="utf-8", errors="replace") as f:
        for line in f.readlines()[-lines:]:
            try:
                events.append(json.loads(line.strip()))
            except Exception:
                pass
    return {"events": list(reversed(events))}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ui.api:app", host="0.0.0.0", port=8000, reload=True)