from __future__ import annotations
import os
import uuid
from typing import Optional
from dotenv import load_dotenv
load_dotenv()
from groq import Groq
from pydantic import BaseModel

from memory_manager import MemoryManager

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your-groq-api-key")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
PERSIST_DIR  = os.getenv("MEMORY_DIR", "memory")

groq_client  = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = (
    "You are a helpful AI assistant with persistent memory across conversations. "
    "You remember facts about the user, prior conversations, and learned knowledge. "
    "Use any recalled memories in your context to give personalised, accurate answers. "
    "When the user shares personal information or new facts, acknowledge and note them."
)

def _sync_sqlite_to_faiss(mm: MemoryManager) -> None:
    existing_texts = {c.text for c in mm.vector._chunks}
    synced = 0

    
    for f in mm.ltm.get_facts(limit=9999):
        if f["fact"] not in existing_texts:
            mm.vector.add(f["fact"], source="fact", topic=f.get("topic", "general"))
            existing_texts.add(f["fact"])
            synced += 1

    for ep in mm.ltm.recent_episodes(n=9999):
        summary = ep.get("summary") or ""
        if summary and summary not in existing_texts:
            mm.vector.add(
                summary,
                source="episodic",
                session_id=ep.get("session_id", ""),
                episode_id=ep.get("id", ""),
            )
            existing_texts.add(summary)
            synced += 1

    if synced:
        print(f"[Memory] Synced {synced} entries from SQLite → FAISS (cross-session recall ready)")
    else:
        print("[Memory] FAISS already up-to-date with SQLite")

_sessions: dict[str, MemoryManager] = {}


def get_or_create_session(session_id: str) -> MemoryManager:
    if session_id not in _sessions:
        mm = MemoryManager(
            session_id=session_id,
            persist_dir=PERSIST_DIR,
            max_session_turns=20,
            recall_k=4,
            system_prompt=SYSTEM_PROMPT,
        )
        # Bootstrap FAISS with all persisted SQLite data
        _sync_sqlite_to_faiss(mm)
        _sessions[session_id] = mm
    return _sessions[session_id]

def run_agent_turn(memory: MemoryManager, user_message: str) -> str:

    # Recall + inject
    context_block = memory.vector.get_context_block(
        query=user_message,
        k=memory.recall_k,
        header="[Recalled memories — use to personalise your response]",
    )
    system_content = SYSTEM_PROMPT
    if context_block:
        system_content += f"\n\n{context_block}"

    # Full message list: system + history + current user message
    messages = [{"role": "system", "content": system_content}]
    for turn in memory.session.get_history():
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": user_message})

    # Call Groq
    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=1024,
    )
    reply_text = response.choices[0].message.content.strip()

    # Save turns to session memory
    memory.session.add("user", user_message)
    memory.session.add("assistant", reply_text)

    # Extract + persist facts immediately
    memory.extract_and_learn_facts(user_message, topic="user_statement")

    return reply_text


if __name__ == "__main__":
    session_id = "cli_test"
    memory     = get_or_create_session(session_id)

    print("=" * 55)
    print(f"  Day 4 — Memory Agent  |  Model: {GROQ_MODEL}")
    print("=" * 55)
    print("Commands: 'quit' | 'stats' | 'save'\n")

    def _auto_save():
        """Save session silently on any exit path."""
        if memory and len(memory.session) > 0:
            try:
                eid = memory.save_session()
                print(f"\n[Memory] Session auto-saved → episode {eid[:8]}...")
            except Exception:
                pass

    import atexit
    atexit.register(_auto_save)  

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting...")
            break

        if not user_input:
            continue

        if user_input.lower() == "quit":
            print("Goodbye!")
            break

        if user_input.lower() == "stats":
            s = memory.memory_summary()
            print(f"\n[Memory Stats]")
            print(f"  Session turns : {s['session_turns']}")
            print(f"  Vector chunks : {s['vector_chunks']}")
            print(f"  Episodes      : {s['db_stats']['episodes']}")
            print(f"  Facts stored  : {s['db_stats']['facts']}")
            continue

        if user_input.lower() == "save":
            eid = memory.save_session()
            print(f"[Session saved → episode: {eid[:8]}...]")
            continue   

        try:
            reply = run_agent_turn(memory, user_input)
            print(f"\nAgent: {reply}\n")
        except Exception as e:
            print(f"\n[Error] {e}\n")