import json
import os
from collections import deque
from datetime import datetime


class MemoryStore:
    def __init__(self, memory_path: str = "memory_store.json", max_messages: int = 10):
        self.memory_path = memory_path
        self.max_messages = max_messages
        self.messages = deque(maxlen=max_messages)
        self._load()

    def _load(self):
        if os.path.exists(self.memory_path):
            try:
                with open(self.memory_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.messages = deque(data, maxlen=self.max_messages)
            except Exception:
                self.messages = deque(maxlen=self.max_messages)

    def _save(self):
        with open(self.memory_path, "w", encoding="utf-8") as f:
            json.dump(list(self.messages), f, ensure_ascii=False, indent=2)

    def add_message(self, role: str, content: str):
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        self._save()

    def get_recent_messages(self):
        return list(self.messages)

    def get_recent_context_text(self):
        return "\n".join(
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in self.messages
        )

    def clear(self):
        self.messages.clear()
        self._save()