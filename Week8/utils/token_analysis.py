import os
import json
import math
from collections import defaultdict, Counter

import matplotlib.pyplot as plt

from transformers import AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")


INPUT_PATH = "data/cleaned_dataset.jsonl"
PLOTS_DIR = "plots"
REPORT_PATH = "data/token_analysis_summary.json"


TOKENIZER_NAME = "Qwen/Qwen2.5-1.5B-Instruct"


def read_jsonl(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Input file not found: {path}")

    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                rows.append(obj)
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON at line {line_no}")
    return rows


def infer_task_type(instruction: str, output: str) -> str:
    instruction_l = instruction.lower()
    output_l = output.lower()

    if any(x in instruction_l for x in [
        "extract",
        "identify and list",
        "structured information",
        "patient details",
        "return the specified health information",
        "convert the clinical text into structured information",
    ]):
        return "extraction"

    if (
        "possible association:" in output_l
        or "concern level:" in output_l
        or "advice:" in output_l
        or any(x in instruction_l for x in [
            "analyze the symptoms",
            "non-diagnostic explanation",
            "health reasoning",
            "possible symptom-based explanation",
            "associated with",
        ])
    ):
        return "reasoning"

    return "qa"


def format_full_prompt(instruction: str, input_text: str, output_text: str = None):
    prompt = (
        f"Instruction: {instruction}\n"
        f"Input: {input_text}\n"
    )
    if output_text is not None:
        prompt += f"Output: {output_text}"
    return prompt


def token_count(tokenizer, text: str) -> int:
    return len(tokenizer.encode(text, add_special_tokens=True))


def percentile(sorted_values, p):
    if not sorted_values:
        return 0
    if len(sorted_values) == 1:
        return sorted_values[0]

    k = (len(sorted_values) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)

    if f == c:
        return sorted_values[int(k)]

    d0 = sorted_values[f] * (c - k)
    d1 = sorted_values[c] * (k - f)
    return d0 + d1


def compute_stats(values):
    if not values:
        return {
            "count": 0,
            "min": 0,
            "max": 0,
            "mean": 0,
            "median": 0,
            "p90": 0,
            "p95": 0,
            "p99": 0,
        }

    values_sorted = sorted(values)
    count = len(values_sorted)
    mean = sum(values_sorted) / count

    if count % 2 == 1:
        median = values_sorted[count // 2]
    else:
        median = (values_sorted[count // 2 - 1] + values_sorted[count // 2]) / 2

    return {
        "count": count,
        "min": values_sorted[0],
        "max": values_sorted[-1],
        "mean": round(mean, 2),
        "median": round(median, 2),
        "p90": round(percentile(values_sorted, 90), 2),
        "p95": round(percentile(values_sorted, 95), 2),
        "p99": round(percentile(values_sorted, 99), 2),
    }


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def make_histogram(values, title, xlabel, output_path, bins=30):
    plt.figure(figsize=(10, 6))
    plt.hist(values, bins=bins)
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel("Frequency")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()


def make_bar_chart(counter_obj, title, xlabel, ylabel, output_path):
    labels = list(counter_obj.keys())
    counts = list(counter_obj.values())

    plt.figure(figsize=(8, 5))
    plt.bar(labels, counts)
    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()


def print_stats_block(name, stats):
    print(f"\n{name}")
    print("-" * len(name))
    print(f"Count  : {stats['count']}")
    print(f"Min    : {stats['min']}")
    print(f"Max    : {stats['max']}")
    print(f"Mean   : {stats['mean']}")
    print(f"Median : {stats['median']}")
    print(f"P90    : {stats['p90']}")
    print(f"P95    : {stats['p95']}")
    print(f"P99    : {stats['p99']}")


def main():
    os.makedirs(PLOTS_DIR, exist_ok=True)

    print(f"Loading tokenizer: {TOKENIZER_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_NAME)

    rows = read_jsonl(INPUT_PATH)
    print(f"Loaded rows: {len(rows)}")

    instruction_tokens = []
    input_tokens = []
    output_tokens = []
    full_prompt_tokens = []

    category_data = defaultdict(lambda: {
        "instruction_tokens": [],
        "input_tokens": [],
        "output_tokens": [],
        "full_prompt_tokens": [],
    })

    long_samples = []

    category_counter = Counter()

    for idx, row in enumerate(rows):
        instruction = row.get("instruction", "").strip()
        input_text = row.get("input", "").strip()
        output_text = row.get("output", "").strip()

        task_type = infer_task_type(instruction, output_text)
        category_counter[task_type] += 1

        instruction_tc = token_count(tokenizer, instruction)
        input_tc = token_count(tokenizer, input_text)
        output_tc = token_count(tokenizer, output_text)
        full_prompt_tc = token_count(
            tokenizer,
            format_full_prompt(instruction, input_text, output_text)
        )

        instruction_tokens.append(instruction_tc)
        input_tokens.append(input_tc)
        output_tokens.append(output_tc)
        full_prompt_tokens.append(full_prompt_tc)

        category_data[task_type]["instruction_tokens"].append(instruction_tc)
        category_data[task_type]["input_tokens"].append(input_tc)
        category_data[task_type]["output_tokens"].append(output_tc)
        category_data[task_type]["full_prompt_tokens"].append(full_prompt_tc)

        long_samples.append({
            "index": idx,
            "task_type": task_type,
            "instruction_tokens": instruction_tc,
            "input_tokens": input_tc,
            "output_tokens": output_tc,
            "full_prompt_tokens": full_prompt_tc,
            "instruction": instruction,
            "input": input_text,
            "output_preview": output_text[:200],
        })

    overall_stats = {
        "instruction_tokens": compute_stats(instruction_tokens),
        "input_tokens": compute_stats(input_tokens),
        "output_tokens": compute_stats(output_tokens),
        "full_prompt_tokens": compute_stats(full_prompt_tokens),
    }

    category_stats = {}
    for task_type, values in category_data.items():
        category_stats[task_type] = {
            "instruction_tokens": compute_stats(values["instruction_tokens"]),
            "input_tokens": compute_stats(values["input_tokens"]),
            "output_tokens": compute_stats(values["output_tokens"]),
            "full_prompt_tokens": compute_stats(values["full_prompt_tokens"]),
        }

    # Sort long samples by full prompt token count
    long_samples_sorted = sorted(long_samples, key=lambda x: x["full_prompt_tokens"], reverse=True)

    summary = {
        "tokenizer_name": TOKENIZER_NAME,
        "total_rows": len(rows),
        "category_counts": dict(category_counter),
        "overall_stats": overall_stats,
        "category_stats": category_stats,
        "top_20_longest_samples": long_samples_sorted[:20],
        "recommended_notes": {
            "general": (
                "Prefer keeping most samples under the p95 full prompt token length for "
                "Colab-friendly fine-tuning. Inspect the longest samples manually."
            ),
            "outlier_hint": (
                "If training is memory-constrained, consider trimming or removing samples "
                "above the 95th or 99th percentile of full prompt token length."
            ),
        }
    }

    save_json(REPORT_PATH, summary)

    # Plots
    make_histogram(
        instruction_tokens,
        "Instruction Token Length Distribution",
        "Instruction Tokens",
        os.path.join(PLOTS_DIR, "instruction_token_hist.png"),
    )

    make_histogram(
        input_tokens,
        "Input Token Length Distribution",
        "Input Tokens",
        os.path.join(PLOTS_DIR, "input_token_hist.png"),
    )

    make_histogram(
        output_tokens,
        "Output Token Length Distribution",
        "Output Tokens",
        os.path.join(PLOTS_DIR, "output_token_hist.png"),
    )

    make_histogram(
        full_prompt_tokens,
        "Full Prompt Token Length Distribution",
        "Full Prompt Tokens",
        os.path.join(PLOTS_DIR, "full_prompt_token_hist.png"),
    )

    make_bar_chart(
        category_counter,
        "Task Type Distribution",
        "Task Type",
        "Count",
        os.path.join(PLOTS_DIR, "task_distribution.png"),
    )

    # Console summary
    print("\n========== TOKEN ANALYSIS SUMMARY ==========")
    print(f"Tokenizer used: {TOKENIZER_NAME}")
    print(f"Total samples : {len(rows)}")

    print("\nCategory Counts")
    print("----------------")
    for k, v in category_counter.items():
        print(f"{k}: {v}")

    print_stats_block("Overall Instruction Tokens", overall_stats["instruction_tokens"])
    print_stats_block("Overall Input Tokens", overall_stats["input_tokens"])
    print_stats_block("Overall Output Tokens", overall_stats["output_tokens"])
    print_stats_block("Overall Full Prompt Tokens", overall_stats["full_prompt_tokens"])

    for task_type in ["qa", "reasoning", "extraction"]:
        if task_type not in category_stats:
            continue
        print(f"\n========== {task_type.upper()} ==========")
        print_stats_block(f"{task_type} - Instruction Tokens", category_stats[task_type]["instruction_tokens"])
        print_stats_block(f"{task_type} - Input Tokens", category_stats[task_type]["input_tokens"])
        print_stats_block(f"{task_type} - Output Tokens", category_stats[task_type]["output_tokens"])
        print_stats_block(f"{task_type} - Full Prompt Tokens", category_stats[task_type]["full_prompt_tokens"])

    print("\nTop 5 longest samples by full prompt token count")
    print("------------------------------------------------")
    for item in long_samples_sorted[:5]:
        print(
            f"Index={item['index']} | "
            f"Task={item['task_type']} | "
            f"FullPromptTokens={item['full_prompt_tokens']} | "
            f"InputPreview={item['input'][:120]}"
        )

    print("\nPlots saved in:", PLOTS_DIR)
    print("Summary JSON saved at:", REPORT_PATH)
    print("=============================================\n")


if __name__ == "__main__":
    main()