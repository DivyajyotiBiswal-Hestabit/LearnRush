
import json
import time
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import requests
import streamlit as st

_root = Path(__file__).parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))


st.set_page_config(
    page_title="NEXUS AI",
    layout="wide",
    initial_sidebar_state="expanded",
)

API_BASE = "http://localhost:8000"


st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

html, body, [class*="css"] {
    font-family: 'Space Grotesk', sans-serif;
}

/* ── Header ── */
.nexus-header {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d1b2a 100%);
    border-radius: 16px;
    padding: 2rem 2.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(99, 179, 237, 0.2);
    position: relative;
    overflow: hidden;
}
.nexus-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 40%, rgba(99,179,237,0.08) 0%, transparent 60%),
                radial-gradient(circle at 70% 60%, rgba(167,139,250,0.06) 0%, transparent 60%);
    pointer-events: none;
}
.nexus-title {
    font-size: 2.2rem;
    font-weight: 700;
    background: linear-gradient(90deg, #63b3ed, #a78bfa, #68d391);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: -0.5px;
}
.nexus-subtitle {
    color: rgba(255,255,255,0.5);
    font-size: 0.9rem;
    margin-top: 4px;
    font-weight: 300;
}

/* ── Agent cards ── */
.agent-card {
    background: #1e1e3a;
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.5rem;
    transition: border-color 0.2s;
}
.agent-card:hover { border-color: rgba(99,179,237,0.4); }
.agent-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: #63b3ed;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.agent-role { font-size: 0.78rem; color: rgba(255,255,255,0.5); margin-top: 2px; }

/* ── Step progress ── */
.step-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    margin-bottom: 6px;
    font-size: 0.85rem;
}
.step-pending  { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.3); }
.step-running  { background: rgba(99,179,237,0.12); color: #63b3ed; border-left: 3px solid #63b3ed; }
.step-done     { background: rgba(104,211,145,0.1); color: #68d391; border-left: 3px solid #68d391; }
.step-failed   { background: rgba(252,129,74,0.1);  color: #fc814a; border-left: 3px solid #fc814a; }
.step-icon     { font-size: 1rem; width: 20px; text-align: center; }

/* ── Result card ── */
.result-card {
    background: #12122a;
    border: 1px solid rgba(104,211,145,0.2);
    border-radius: 12px;
    padding: 1.5rem;
}

/* ── Metric pill ── */
.metric-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 1rem; }
.metric-pill {
    background: rgba(99,179,237,0.1);
    border: 1px solid rgba(99,179,237,0.2);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 0.78rem;
    color: #63b3ed;
}

/* ── Verdict badge ── */
.verdict-pass { background: rgba(104,211,145,0.15); color: #68d391; padding: 3px 12px; border-radius: 20px; font-size:0.8rem; font-weight:600; }
.verdict-fail { background: rgba(252,129,74,0.15);  color: #fc814a; padding: 3px 12px; border-radius: 20px; font-size:0.8rem; font-weight:600; }
.verdict-cond { background: rgba(246,224,94,0.15);  color: #f6e05e; padding: 3px 12px; border-radius: 20px; font-size:0.8rem; font-weight:600; }

/* ── Tab styling ── */
.stTabs [data-baseweb="tab-list"] {
    background: #1a1a3a;
    border-radius: 10px;
    padding: 4px;
    gap: 2px;
}
.stTabs [data-baseweb="tab"] {
    color: rgba(255,255,255,0.5);
    border-radius: 8px;
    font-size: 0.85rem;
}
.stTabs [aria-selected="true"] {
    background: rgba(99,179,237,0.15);
    color: #63b3ed;
}

/* ── Buttons ── */
.stButton > button {
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.6rem 1.5rem;
    transition: opacity 0.2s;
}
.stButton > button:hover { opacity: 0.85; }

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: #0d0d20;
    border-right: 1px solid rgba(99,179,237,0.1);
}

/* ── Code blocks ── */
code, .stCode { font-family: 'JetBrains Mono', monospace !important; }

/* ── Inputs ── */
.stTextArea textarea, .stTextInput input {
    background: #1a1a3a;
    border: 1px solid rgba(99,179,237,0.2);
    border-radius: 8px;
    color: white;
    font-family: 'Space Grotesk', sans-serif;
}
</style>
""", unsafe_allow_html=True)

#  Session state

def init_state():
    defaults = {
        "api_key":      os.getenv("GROQ_API_KEY", ""),
        "session_id":   "",
        "last_result":  None,
        "step_states":  {},
        "running":      False,
        "messages":     [],   # chat history for display
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

init_state()

#  Helpers

def api_get(path: str, **kwargs):
    try:
        r = requests.get(f"{API_BASE}{path}", timeout=10, **kwargs)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        st.error(" Cannot connect to NEXUS API. Start it with: `uvicorn ui.api:app --reload --port 8000`")
        return None
    except Exception as e:
        st.error(f"API error: {e}")
        return None

def api_post(path: str, payload: dict, timeout: int = 300):
    try:
        r = requests.post(f"{API_BASE}{path}", json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        st.error(" Cannot connect to NEXUS API.")
        return None
    except Exception as e:
        st.error(f"API error: {e}")
        return None

def verdict_badge(verdict: str) -> str:
    v = verdict.upper()
    if "PASS" in v and "COND" not in v:
        return f'<span class="verdict-pass">✓ {verdict}</span>'
    elif "FAIL" in v:
        return f'<span class="verdict-fail">✗ {verdict}</span>'
    else:
        return f'<span class="verdict-cond">~ {verdict}</span>'

STEP_ICONS = {
    "pending": "○",
    "running": "⟳",
    "done":    "✓",
    "failed":  "✗",
}

#  Sidebar

with st.sidebar:
    st.markdown("""
    <div style="padding: 1rem 0 0.5rem;">
        <div style="font-size:1.3rem;font-weight:700;color:#63b3ed;letter-spacing:-0.3px;">🧠 NEXUS AI</div>
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.35);margin-top:2px;">Multi-Agent System v1.0</div>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    # API Key
    st.markdown('<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:4px;">GROQ API KEY</div>', unsafe_allow_html=True)
    api_key_input = st.text_input(
        "API Key", value=st.session_state.api_key,
        type="password", label_visibility="collapsed",
        placeholder="gsk_..."
    )
    if api_key_input:
        st.session_state.api_key = api_key_input

    # Session ID
    st.markdown('<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:4px;margin-top:12px;">SESSION ID</div>', unsafe_allow_html=True)
    session_input = st.text_input(
        "Session ID", value=st.session_state.session_id,
        label_visibility="collapsed",
        placeholder="Leave blank for new session"
    )
    st.session_state.session_id = session_input

    st.divider()

    # API status
    health = api_get("/health")
    if health:
        key_status = "🟢 Key set" if health.get("groq_key_set") else "🔴 No key"
        st.markdown(f'<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);">API Status: <span style="color:#68d391">● Online</span></div>', unsafe_allow_html=True)
        st.markdown(f'<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:4px;">{key_status}</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div style="font-size:0.75rem;color:#fc814a;">● API Offline</div>', unsafe_allow_html=True)

    st.divider()

    # Agent list
    st.markdown('<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:8px;">AGENTS</div>', unsafe_allow_html=True)
    agents_data = api_get("/agents")
    if agents_data:
        for agent in agents_data["agents"]:
            
            st.markdown(f"""
            <div class="agent-card">
                <div class="agent-name">{agent['name']}</div>
                <div class="agent-role">{agent['role'][:60]}...</div>
            </div>
            """, unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
#  Header
# ══════════════════════════════════════════════════════════════════════════════

st.markdown("""
<div class="nexus-header">
    <div class="nexus-title">NEXUS AI</div>
    <div class="nexus-subtitle">Autonomous Multi-Agent System · Powered by Groq + LLaMA 3.3</div>
</div>
""", unsafe_allow_html=True)

#  Main tabs

tab_run, tab_code, tab_csv, tab_ask, tab_memory, tab_outputs, tab_logs = st.tabs([
    " Run Pipeline",
    " Code Gen",
    " CSV Analysis",
    " Ask Agent",
    " Memory",
    " Outputs",
    " Logs",
])


#  TAB 1 — Run Pipeline

with tab_run:
    col_input, col_progress = st.columns([1, 1], gap="large")

    with col_input:
        st.markdown("####  Goal")
        goal = st.text_area(
            "goal", height=120, label_visibility="collapsed",
            placeholder="e.g. Plan a startup in AI for healthcare\ne.g. Design a RAG pipeline for 50k documents\ne.g. Generate backend architecture for a scalable SaaS app",
        )

        # Quick examples
        st.markdown('<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-bottom:6px;">QUICK EXAMPLES</div>', unsafe_allow_html=True)
        examples = [
            "Plan a startup in AI for healthcare",
            "Generate backend architecture for a scalable SaaS app",
            "Design a RAG pipeline for 50,000 documents",
            "Create a go-to-market strategy for a B2B SaaS product",
        ]
        for ex in examples:
            if st.button(f"→ {ex[:55]}", key=f"ex_{ex[:20]}", use_container_width=True):
                st.session_state["goal_prefill"] = ex
                st.rerun()

        if "goal_prefill" in st.session_state:
            goal = st.session_state.pop("goal_prefill")

        data_input = st.text_area("Additional data / context (optional)", height=80, placeholder="Paste CSV or extra context here...")

        run_col, _ = st.columns([1, 2])
        with run_col:
            run_btn = st.button("▶ Run NEXUS", use_container_width=True, disabled=not goal)

    with col_progress:
        st.markdown("####  Pipeline Progress")

        STEPS = [
            (1, "Orchestrator",  "Analyses goal & strategy"),
            (2, "Planner",       "Decomposes into sub-tasks"),
            (3, "DAG Executor",  "Runs agents in order"),
            (4, "Critic",        "Reviews all outputs"),
            (5, "Optimizer",     "Applies improvements"),
            (6, "Validator",     "Certifies quality"),
            (7, "Reporter",      "Compiles final report"),
        ]

        step_container = st.container()
        with step_container:
            step_placeholders = {}
            for n, name, desc in STEPS:
                ph = st.empty()
                step_placeholders[n] = ph
                ph.markdown(f"""
                <div class="step-row step-pending">
                    <span class="step-icon">○</span>
                    <span><b>Step {n}:</b> {name}</span>
                    <span style="margin-left:auto;font-size:0.72rem;opacity:0.5">{desc}</span>
                </div>""", unsafe_allow_html=True)

        node_placeholder = st.empty()
        status_placeholder = st.empty()


    if run_btn and goal:
        if not st.session_state.api_key:
            st.error("Set your Groq API key in the sidebar first.")
        else:
            st.session_state.running = True
            step_status = {n: "pending" for n, _, _ in STEPS}

            def update_step(n, status, extra=""):
                step_status[n] = status
                _, name, desc = STEPS[n-1]
                icon = STEP_ICONS.get(status, "○")
                step_placeholders[n].markdown(f"""
                <div class="step-row step-{status}">
                    <span class="step-icon">{icon}</span>
                    <span><b>Step {n}:</b> {name}</span>
                    <span style="margin-left:auto;font-size:0.72rem;opacity:0.7">{extra or desc}</span>
                </div>""", unsafe_allow_html=True)

            payload = {
                "goal":       goal,
                "data":       data_input,
                "session_id": st.session_state.session_id or None,
                "api_key":    st.session_state.api_key,
            }

            # Stream SSE events
            final_result = None
            with requests.post(f"{API_BASE}/run/stream", json=payload, stream=True, timeout=600) as resp:
                for raw_line in resp.iter_lines():
                    if not raw_line:
                        continue
                    line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
                    if not line.startswith("data:"):
                        continue
                    try:
                        evt = json.loads(line[5:].strip())
                    except Exception:
                        continue

                    etype = evt.get("event")
                    edata = evt.get("data", {})

                    if etype == "step":
                        n      = edata.get("step", 0)
                        status = edata.get("status", "pending")
                        extra  = ""
                        if status == "done":
                            if "plan" in edata:
                                extra = f"{len(edata['plan'])} tasks"
                            elif "validation" in edata:
                                v = edata["validation"]
                                extra = f"{v.get('verdict','?')} · {v.get('score','?')}/10"
                        update_step(n, status, extra)

                    elif etype == "node":
                        name   = edata.get("name","")
                        agent  = edata.get("agent","")
                        status = edata.get("status","")
                    
                        color  = "#63b3ed" if status=="running" else ("#68d391" if status=="done" else "#fc814a")
                        node_placeholder.markdown(
                            f'<div style="font-size:0.78rem;color:{color};padding:4px 8px;background:rgba(255,255,255,0.03);border-radius:6px;">'
                            f' <b>{name}</b> [{agent}] — {status}</div>',
                            unsafe_allow_html=True
                        )

                    elif etype == "complete":
                        final_result = edata
                        st.session_state.last_result = edata
                        node_placeholder.empty()

                    elif etype == "error":
                        status_placeholder.error(f"Pipeline error: {edata.get('message')}")

            # Show result
            if final_result:
                st.divider()
                st.markdown("####  Final Report")

                val   = final_result.get("validation", {})
                score = val.get("score", "?")
                verdict = val.get("verdict", "?")
                dag_sum = final_result.get("dag_summary", {})

                st.markdown(f"""
                <div class="metric-row">
                    <div class="metric-pill">✓ {dag_sum.get('total',0)} tasks</div>
                    <div class="metric-pill"> Score: {score}/10</div>
                    <div class="metric-pill">Session: {final_result.get('session_id','')[:20]}</div>
                    {verdict_badge(verdict)}
                </div>
                """, unsafe_allow_html=True)

                report_text = final_result.get("final_report", "")
                if report_text:
                    # Strip the HTML comment at the top
                    if report_text.startswith("<!--"):
                        report_text = report_text[report_text.find("-->")+3:].strip()
                    with st.expander(" View Full Report", expanded=True):
                        st.markdown(report_text)

                    st.download_button(
                        "⬇ Download Report",
                        data=report_text,
                        file_name=f"nexus_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md",
                        mime="text/markdown",
                    )

            st.session_state.running = False


#  TAB 2 — Code Generation

with tab_code:
    st.markdown("####  Generate Code")

    c1, c2, c3 = st.columns([3, 1, 1])
    with c1:
        code_task = st.text_input("Describe what to build", placeholder="FastAPI REST API with JWT auth and PostgreSQL")
    with c2:
        lang = st.selectbox("Language", ["python", "javascript", "typescript", "bash", "sql", "go", "rust"])
    with c3:
        fname = st.text_input("Filename (optional)", placeholder="api.py")

    if st.button("⚡ Generate", key="gen_code", disabled=not code_task):
        if not st.session_state.api_key:
            st.error("Set your Groq API key first.")
        else:
            with st.spinner("CoderAgent is writing..."):
                result = api_post("/code", {
                    "task":       code_task,
                    "language":   lang,
                    "filename":   fname,
                    "api_key":    st.session_state.api_key,
                    "session_id": st.session_state.session_id or None,
                }, timeout=120)

            if result and result.get("status") == "success":
                output = result["output"]
                # Extract path comment
                saved_path = ""
                if output.startswith("# Saved to:"):
                    saved_path = output.split("\n")[0].replace("# Saved to:", "").strip()
                    code_body  = "\n".join(output.split("\n")[2:])
                else:
                    code_body = output

                if saved_path:
                    st.success(f"Saved to: `{saved_path}`")

                st.code(code_body, language=lang)
                st.download_button("⬇ Download", data=code_body,
                                   file_name=fname or f"output.{lang[:2]}",
                                   mime="text/plain")


#  TAB 3 — CSV Analysis

with tab_csv:
    st.markdown("####  CSV Business Analysis")

    uploaded = st.file_uploader("Upload CSV file", type=["csv", "txt"])
    csv_question = st.text_input("Analysis question (optional)", placeholder="What are the top revenue opportunities?")

    csv_content_str = ""
    if uploaded:
        csv_content_str = uploaded.read().decode("utf-8")
        st.markdown(f'<div style="font-size:0.78rem;color:#68d391;margin-bottom:8px;">📎 {uploaded.name} ({len(csv_content_str)} chars)</div>', unsafe_allow_html=True)
        with st.expander("Preview (first 500 chars)"):
            st.code(csv_content_str[:500])

    # Or paste directly
    csv_paste = st.text_area("Or paste CSV here", height=120, placeholder="col1,col2,col3\n1,2,3\n...")

    final_csv = csv_content_str or csv_paste

    if st.button(" Analyse", key="analyse_csv", disabled=not final_csv):
        if not st.session_state.api_key:
            st.error("Set your Groq API key first.")
        else:
            with st.spinner("AnalystAgent is processing..."):
                result = api_post("/analyse", {
                    "csv_content": final_csv,
                    "question":    csv_question,
                    "api_key":     st.session_state.api_key,
                    "session_id":  st.session_state.session_id or None,
                }, timeout=120)

            if result and result.get("status") == "success":
                st.markdown("#### Analysis Results")
                st.markdown(result["analysis"])


#  TAB 4 — Ask Agent

with tab_ask:
    st.markdown("#### Chat with a Single Agent")

    ask_agent_name = st.selectbox(
        "Choose agent",
        ["researcher", "analyst", "coder", "critic", "optimizer", "validator", "reporter"],
        format_func=lambda x: f" {x.capitalize()}"
    )

    # Chat history display
    chat_container = st.container()
    with chat_container:
        for msg in st.session_state.messages:
            role = msg["role"]
            if role == "user":
                st.markdown(f"""
                <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
                  <div style="background:rgba(99,179,237,0.15);border:1px solid rgba(99,179,237,0.25);border-radius:12px 12px 2px 12px;padding:10px 14px;max-width:80%;font-size:0.875rem;color:#e2e8f0">
                    {msg['content']}
                  </div>
                </div>""", unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start;">
                  <div style="background:rgba(167,139,250,0.15);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0">{emoji}</div>
                  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:2px 12px 12px 12px;padding:10px 14px;max-width:88%;font-size:0.875rem;color:#e2e8f0">
                    {msg['content'][:1000]}
                  </div>
                </div>""", unsafe_allow_html=True)

    question = st.chat_input("Ask the agent anything...")
    if question:
        if not st.session_state.api_key:
            st.error("Set your Groq API key first.")
        else:
            st.session_state.messages.append({"role": "user", "content": question})
            with st.spinner(f"{ask_agent_name} is thinking..."):
                result = api_post("/ask", {
                    "question":   question,
                    "agent":      ask_agent_name,
                    "api_key":    st.session_state.api_key,
                    "session_id": st.session_state.session_id or None,
                }, timeout=120)

            if result and result.get("status") == "success":
                answer = result["answer"]
                st.session_state.messages.append({
                    "role": "assistant", "content": answer, "agent": ask_agent_name
                })
                st.rerun()


#  TAB 5 — Memory

with tab_memory:
    st.markdown("####  Memory Store")

    col_search, col_sessions = st.columns([1, 1], gap="large")

    with col_search:
        st.markdown("**Similarity Recall**")
        recall_q = st.text_input("Search query", placeholder="healthcare AI startup")
        k_val    = st.slider("Top K results", 1, 20, 5)

        if st.button(" Search Memory", disabled=not recall_q):
            result = api_get(f"/memory/recall?query={recall_q}&k={k_val}")
            if result:
                hits = result.get("hits", [])
                if not hits:
                    st.info("No memories found above the similarity threshold.")
                else:
                    for h in hits:
                        score = h.get("score", 0)
                        score_color = "#68d391" if score > 0.85 else "#f6e05e" if score > 0.75 else "#fc814a"
                        st.markdown(f"""
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;margin-bottom:6px;">
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                <span style="font-size:0.7rem;color:rgba(255,255,255,0.35)">{h.get('session_id','')[:30]} · {h.get('ts','')[:16]}</span>
                                <span style="font-size:0.75rem;font-weight:600;color:{score_color}">sim: {score:.3f}</span>
                            </div>
                            <div style="font-size:0.82rem;color:#e2e8f0">{h.get('text','')[:250]}</div>
                        </div>""", unsafe_allow_html=True)

    with col_sessions:
        st.markdown("**Session History**")
        sessions_data = api_get("/sessions")
        if sessions_data and sessions_data["sessions"]:
            selected_sess = st.selectbox("Select session", sessions_data["sessions"])
            if st.button(" Load Session"):
                sess_data = api_get(f"/sessions/{selected_sess}")
                if sess_data:
                    st.markdown(f'<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);margin-bottom:8px;">{sess_data["turns"]} turns</div>', unsafe_allow_html=True)
                    for turn in sess_data["history"][-20:]:
                        role  = turn.get("role", "")
                        agent = turn.get("agent", "")
                        ts    = turn.get("ts", "")[:16]
                        text  = turn.get("content", "")[:200]
                        color = "#63b3ed" if role == "user" else "#a78bfa"
                        st.markdown(f"""
                        <div style="margin-bottom:6px;font-size:0.78rem;">
                            <span style="color:{color};font-weight:600">{role.upper()}{f' [{agent}]' if agent else ''}</span>
                            <span style="color:rgba(255,255,255,0.25);margin-left:8px">{ts}</span>
                            <div style="color:rgba(255,255,255,0.6);margin-top:2px">{text}</div>
                        </div>""", unsafe_allow_html=True)
        else:
            st.info("No sessions recorded yet.")


#  TAB 6 — Outputs

with tab_outputs:
    col_rep, col_code_out = st.columns([1, 1], gap="large")

    with col_rep:
        st.markdown("####  Saved Reports")
        reports = api_get("/outputs/reports")
        if reports and reports["reports"]:
            for rep in reports["reports"]:
                size_kb = rep["size_bytes"] // 1024
                ts      = rep["modified"][:16]
                st.markdown(f"""
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:0.83rem;color:#e2e8f0;font-weight:500"> {rep['name']}</div>
                        <div style="font-size:0.7rem;color:rgba(255,255,255,0.3);margin-top:2px">{ts} · {size_kb} KB</div>
                    </div>
                </div>""", unsafe_allow_html=True)

                r = requests.get(f"{API_BASE}/outputs/reports/{rep['name']}", timeout=10)
                if r.status_code == 200:
                    st.download_button(
                        f"⬇ {rep['name'][:30]}",
                        data=r.text, file_name=rep["name"],
                        mime="text/markdown", key=f"dl_rep_{rep['name']}"
                    )
        else:
            st.info("No reports yet. Run the pipeline first.")

    with col_code_out:
        st.markdown("####  Saved Code Files")
        code_files = api_get("/outputs/code")
        if code_files and code_files["files"]:
            for cf in code_files["files"]:
                size_kb = max(1, cf["size_bytes"] // 1024)
                ts      = cf["modified"][:16]
                ext     = cf["name"].split(".")[-1] if "." in cf["name"] else "txt"
                st.markdown(f"""
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px;margin-bottom:6px;">
                    <div style="font-size:0.83rem;color:#e2e8f0;font-weight:500"> {cf['name']}</div>
                    <div style="font-size:0.7rem;color:rgba(255,255,255,0.3);margin-top:2px">{ts} · {size_kb} KB</div>
                </div>""", unsafe_allow_html=True)
                r = requests.get(f"{API_BASE}/outputs/code/{cf['name']}", timeout=10)
                if r.status_code == 200:
                    st.download_button(
                        f"⬇ {cf['name'][:30]}", data=r.text,
                        file_name=cf["name"], mime="text/plain",
                        key=f"dl_code_{cf['name']}"
                    )
        else:
            st.info("No code files yet. Use Code Gen tab.")


#  TAB 7 — Logs

with tab_logs:
    st.markdown("####  System Logs")

    log_col, trace_col = st.columns([1, 1], gap="large")

    with log_col:
        st.markdown("**nexus.log**")
        n_lines = st.slider("Lines", 20, 500, 100, key="log_lines")
        if st.button(" Refresh", key="refresh_logs"):
            st.rerun()

        logs = api_get(f"/logs?lines={n_lines}")
        if logs and logs["lines"]:
            log_text = "\n".join(logs["lines"])
            st.code(log_text, language="text")
        else:
            st.info("No logs yet.")

    with trace_col:
        st.markdown("**trace.jsonl** (recent events)")
        n_trace = st.slider("Events", 10, 200, 50, key="trace_lines")
        trace   = api_get(f"/logs/trace?lines={n_trace}")
        if trace and trace["events"]:
            for evt in trace["events"][:30]:
                etype = evt.get("event", "")
                agent = evt.get("agent", "")
                ts    = evt.get("ts", "")[:16]

                color_map = {
                    "TASK_START": "#63b3ed", "TASK_END": "#68d391",
                    "ERROR": "#fc814a", "REFLECTION": "#a78bfa",
                    "DAG_SUCCESS": "#68d391", "DAG_FAILED": "#fc814a",
                    "MEMORY_SEARCH": "#f6e05e",
                }
                color = color_map.get(etype, "rgba(255,255,255,0.4)")

                st.markdown(f"""
                <div style="font-family:monospace;font-size:0.72rem;padding:3px 8px;border-left:2px solid {color};margin-bottom:3px;background:rgba(255,255,255,0.02);">
                    <span style="color:{color};font-weight:600">{etype}</span>
                    {f'<span style="color:rgba(255,255,255,0.4);margin-left:6px">[{agent}]</span>' if agent else ''}
                    <span style="color:rgba(255,255,255,0.25);float:right">{ts}</span>
                </div>""", unsafe_allow_html=True)
        else:
            st.info("No trace events yet.")

#  Footer

st.markdown("""
<div style="text-align:center;padding:2rem 0 1rem;font-size:0.72rem;color:rgba(255,255,255,0.2);">
    NEXUS AI v1.0.0 · Autonomous Multi-Agent System · Groq + LLaMA 3.3 70B
</div>
""", unsafe_allow_html=True)