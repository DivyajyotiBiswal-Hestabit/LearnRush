from __future__ import annotations
import json
import time
from dataclasses import asdict, dataclass, field
from typing import Literal

Role = Literal["user", "assistant", "system"]

@dataclass
class Turn:
    role: Role
    content: str
    timestamp: float = field(default_factory=time.time)
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)

    def to_autogen_message(self) -> dict:
        """Return a dict compatible with AutoGen / OpenAI chat format."""
        return {"role": self.role, "content": self.content}


class SessionMemory:
    """
    Short-term, in-process conversation memory.

    Parameters
    ----------
    max_turns : int
        Maximum number of turns to keep in the sliding window.
        Older turns are evicted when the limit is exceeded.
    system_prompt : str | None
        Optional system message injected at position 0 of every
        AutoGen-formatted message list.
    """

    def __init__(
        self,
        max_turns: int = 20,
        system_prompt: str | None = None,
    ) -> None:
        self.max_turns = max_turns
        self.system_prompt = system_prompt
        self._turns: list[Turn] = []

    def add(self, role: Role, content: str, **metadata) -> Turn:
        """Append a turn and enforce the sliding window."""
        turn = Turn(role=role, content=content, metadata=metadata)
        self._turns.append(turn)
        self._evict()
        return turn

    def get_history(self) -> list[Turn]:
        """Return all turns in chronological order."""
        return list(self._turns)

    def to_autogen_messages(self, inject_context: str | None = None) -> list[dict]:
        
        messages: list[dict] = []

        # Build system message
        sys_parts: list[str] = []
        if self.system_prompt:
            sys_parts.append(self.system_prompt)
        if inject_context:
            sys_parts.append(f"\n\n[Relevant memory retrieved]\n{inject_context}")
        if sys_parts:
            messages.append({"role": "system", "content": "\n".join(sys_parts)})

        messages.extend(t.to_autogen_message() for t in self._turns)
        return messages

    def clear(self) -> None:
        """Wipe the session (e.g. on conversation reset)."""
        self._turns.clear()

    def last_n(self, n: int) -> list[Turn]:
        """Return the most recent *n* turns."""
        return self._turns[-n:]

    def summary_text(self) -> str:
        """
        Lightweight plain-text dump used when persisting a session
        summary to long-term storage or the vector store.
        """
        lines = []
        for t in self._turns:
            ts = time.strftime("%H:%M:%S", time.localtime(t.timestamp))
            lines.append(f"[{ts}] {t.role.upper()}: {t.content}")
        return "\n".join(lines)

    def to_json(self) -> str:
        return json.dumps([t.to_dict() for t in self._turns], indent=2)

    @classmethod
    def from_json(cls, data: str, **kwargs) -> "SessionMemory":
        sm = cls(**kwargs)
        for item in json.loads(data):
            sm._turns.append(Turn(**item))
        return sm

    def __len__(self) -> int:
        return len(self._turns)

    def __repr__(self) -> str:
        return f"SessionMemory(turns={len(self._turns)}, max={self.max_turns})"

    def _evict(self) -> None:
        """Drop oldest turns when the window overflows (keep system turns)."""
        while len(self._turns) > self.max_turns:
            self._turns.pop(0)

