import uuid
try:
    from .model_loader import LlamaModelLoader
except ImportError:
    from model_loader import LlamaModelLoader
model = LlamaModelLoader()

history = []

print("Local LLM CLI Chat (type 'exit' to quit)\n")

while True:
    user_input = input("You: ")

    if user_input.lower() in ["exit", "quit"]:
        break

    response = model.generate_chat(
        user_prompt=user_input,
        history=history
    )

    print("\nAssistant:", response, "\n")

    history.append({"role": "user", "content": user_input})
    history.append({"role": "assistant", "content": response})