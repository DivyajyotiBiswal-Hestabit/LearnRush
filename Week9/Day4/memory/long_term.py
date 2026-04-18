import sqlite3
import os


class LongTermMemory:
    def __init__(self, db_path="Day4/memory/long_term.db"):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.create_table()

    def create_table(self):
        self.conn.execute("""
        CREATE TABLE IF NOT EXISTS memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT,
            response TEXT
        )
        """)
        self.conn.commit()

    def add(self, query, response):
        self.conn.execute(
            "INSERT INTO memory (query, response) VALUES (?, ?)",
            (query, response)
        )
        self.conn.commit()

    def search(self, query):
        query_lower = query.lower().strip()

    # 🚫 block follow-ups
        if query_lower in ["explain again", "repeat", "again"]:
            return []

        cursor = self.conn.execute(
            "SELECT query, response FROM memory ORDER BY id DESC LIMIT 20"
        )
        rows = cursor.fetchall()

        query_words = set(query_lower.split())
        stopwords = {"what", "is", "the", "a", "an", "of", "in", "on"}

        query_words = query_words - stopwords

        results = []

        for q, r in rows:
            q_words = set(q.lower().split()) - stopwords

            common = query_words & q_words

        # 🔥 STRICT MATCH
            if len(common) >= 1:
                results.append(f"[Past]\nQ: {q}\nA: {r}")

        return results[:1]   # 🔥 LIMIT MORE