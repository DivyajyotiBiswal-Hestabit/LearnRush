class SessionMemory:
    def __init__(self, window_size=10):
        self.window_size = window_size
        self.history = []

    def add(self, role, content):
        self.history.append({"role": role, "content": content})
        self.history = self.history[-self.window_size:]

    def get_context(self):
        context = ""
        for msg in self.history:
            context += f"{msg['role']}: {msg['content']}\n"
        return context
    
    def get_last_assistant_message(self):
        for msg in reversed(self.history):
            if msg["role"] == "assistant":
                return msg["content"]
        return ""