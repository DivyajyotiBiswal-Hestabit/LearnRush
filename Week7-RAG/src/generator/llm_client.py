import torch
from transformers import AutoTokenizer, AutoModelForCausalLM


class LocalLLMClient:
    def __init__(self, model_name: str = "Qwen/Qwen2-1.5B-Instruct"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = model_name

        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype="auto"
        ).to(self.device)

    def generate(self, prompt: str, max_new_tokens: int = 300) -> str:
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                temperature=0.0,
                pad_token_id=self.tokenizer.eos_token_id
            )

        decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Remove the prompt part if it is echoed back
        if decoded.startswith(prompt):
            decoded = decoded[len(prompt):].strip()

        return decoded.strip()