from __future__ import annotations

import json
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Optional

_DDL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS episodic_memory (
    id          TEXT    PRIMARY KEY,
    session_id  TEXT    NOT NULL,
    content     TEXT    NOT NULL,       -- full conversation / summary text
    summary     TEXT,                  -- short LLM-generated summary
    created_at  REAL    NOT NULL,
    metadata    TEXT    DEFAULT '{}'   -- JSON blob
);

CREATE TABLE IF NOT EXISTS semantic_memory (
    id          TEXT    PRIMARY KEY,
    fact        TEXT    NOT NULL UNIQUE,
    topic       TEXT    NOT NULL DEFAULT 'general',
    confidence  REAL    NOT NULL DEFAULT 1.0,
    created_at  REAL    NOT NULL,
    updated_at  REAL    NOT NULL,
    metadata    TEXT    DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_episodic_session  ON episodic_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_episodic_created  ON episodic_memory(created_at);
CREATE INDEX IF NOT EXISTS idx_semantic_topic    ON semantic_memory(topic);
"""


class LongTermMemory:
    
    def __init__(self, db_path: str | Path = "memory/long_term.db") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextmanager
    def _conn(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.executescript(_DDL)
        print(f"[LongTermMemory] Database ready at {self.db_path}")

    def save_episode(
        self,
        content: str,
        session_id: str | None = None,
        summary: str | None = None,
        **metadata,
    ) -> str:
        """
        Persist a full session transcript or summary as an episodic memory.

        Returns the generated episode ID.
        """
        episode_id = str(uuid.uuid4())
        session_id = session_id or str(uuid.uuid4())
        now        = time.time()

        with self._conn() as conn:
            conn.execute(
                """INSERT INTO episodic_memory
                   (id, session_id, content, summary, created_at, metadata)
                   VALUES (?,?,?,?,?,?)""",
                (episode_id, session_id, content, summary, now, json.dumps(metadata)),
            )

        print(f"[LongTermMemory] Episode saved: {episode_id[:8]}…")
        return episode_id

    def get_episode(self, episode_id: str) -> dict | None:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT * FROM episodic_memory WHERE id=?", (episode_id,)
            ).fetchone()
        return dict(row) if row else None

    def recent_episodes(self, n: int = 10, session_id: str | None = None) -> list[dict]:
        """Return the *n* most recent episodes, optionally filtered by session."""
        with self._conn() as conn:
            if session_id:
                rows = conn.execute(
                    "SELECT * FROM episodic_memory WHERE session_id=? "
                    "ORDER BY created_at DESC LIMIT ?",
                    (session_id, n),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM episodic_memory ORDER BY created_at DESC LIMIT ?",
                    (n,),
                ).fetchall()
        return [dict(r) for r in rows]

    def search_episodes(self, keyword: str, limit: int = 10) -> list[dict]:
        """Full-text substring search over episode content and summaries."""
        pattern = f"%{keyword}%"
        with self._conn() as conn:
            rows = conn.execute(
                """SELECT * FROM episodic_memory
                   WHERE content LIKE ? OR summary LIKE ?
                   ORDER BY created_at DESC LIMIT ?""",
                (pattern, pattern, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    # ── Semantic memory ──────────────────────────

    def upsert_fact(
        self,
        fact: str,
        topic: str = "general",
        confidence: float = 1.0,
        **metadata,
    ) -> str:
        """
        Insert or update a semantic fact.

        If the exact fact string already exists it is refreshed (timestamp + confidence).
        Returns the fact ID.
        """
        fact_id = str(uuid.uuid4())
        now     = time.time()

        with self._conn() as conn:
            existing = conn.execute(
                "SELECT id FROM semantic_memory WHERE fact=?", (fact,)
            ).fetchone()

            if existing:
                conn.execute(
                    """UPDATE semantic_memory
                       SET confidence=?, updated_at=?, topic=?, metadata=?
                       WHERE fact=?""",
                    (confidence, now, topic, json.dumps(metadata), fact),
                )
                return existing["id"]
            else:
                conn.execute(
                    """INSERT INTO semantic_memory
                       (id, fact, topic, confidence, created_at, updated_at, metadata)
                       VALUES (?,?,?,?,?,?,?)""",
                    (fact_id, fact, topic, confidence, now, now, json.dumps(metadata)),
                )
                return fact_id

    def get_facts(
        self,
        topic: str | None = None,
        min_confidence: float = 0.0,
        limit: int = 50,
    ) -> list[dict]:
        """Retrieve semantic facts, optionally filtered by topic / confidence."""
        with self._conn() as conn:
            if topic:
                rows = conn.execute(
                    """SELECT * FROM semantic_memory
                       WHERE topic=? AND confidence>=?
                       ORDER BY confidence DESC, updated_at DESC LIMIT ?""",
                    (topic, min_confidence, limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    """SELECT * FROM semantic_memory
                       WHERE confidence>=?
                       ORDER BY confidence DESC, updated_at DESC LIMIT ?""",
                    (min_confidence, limit),
                ).fetchall()
        return [dict(r) for r in rows]

    def search_facts(self, keyword: str, limit: int = 20) -> list[dict]:
        """Full-text substring search over fact text."""
        pattern = f"%{keyword}%"
        with self._conn() as conn:
            rows = conn.execute(
                """SELECT * FROM semantic_memory
                   WHERE fact LIKE ?
                   ORDER BY confidence DESC, updated_at DESC LIMIT ?""",
                (pattern, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    def delete_fact(self, fact_id: str) -> bool:
        with self._conn() as conn:
            cur = conn.execute("DELETE FROM semantic_memory WHERE id=?", (fact_id,))
        return cur.rowcount > 0

    #  Stats & utilities 

    def stats(self) -> dict:
        with self._conn() as conn:
            ep_count   = conn.execute("SELECT COUNT(*) FROM episodic_memory").fetchone()[0]
            sem_count  = conn.execute("SELECT COUNT(*) FROM semantic_memory").fetchone()[0]
            topics     = conn.execute(
                "SELECT topic, COUNT(*) as cnt FROM semantic_memory GROUP BY topic"
            ).fetchall()
        return {
            "episodes": ep_count,
            "facts": sem_count,
            "topics": {r["topic"]: r["cnt"] for r in topics},
        }

    def export_json(self) -> str:
        """Dump entire database to JSON (useful for backup / migration)."""
        return json.dumps({
            "episodes": self.recent_episodes(n=9999),
            "facts":    self.get_facts(limit=9999),
        }, indent=2, default=str)

    def __repr__(self) -> str:
        s = self.stats()
        return (
            f"LongTermMemory(db={self.db_path}, "
            f"episodes={s['episodes']}, facts={s['facts']})"
        )

