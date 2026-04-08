import os
import json
import re
import random
from collections import Counter

random.seed(42)

RAW_PATH = "data/raw_dataset.jsonl"
CLEANED_PATH = "data/cleaned_dataset.jsonl"
TRAIN_PATH = "data/train.jsonl"
VAL_PATH = "data/val.jsonl"

TARGET_COUNTS = {
    "qa": 350,
    "reasoning": 350,
    "extraction": 400,
}

VAL_COUNTS = {
    "qa": 35,
    "reasoning": 35,
    "extraction": 40,
}

MIN_INPUT_CHARS = 8
MIN_OUTPUT_CHARS = 20
MAX_TOTAL_CHARS = 1800
MAX_INPUT_CHARS = 900
MAX_OUTPUT_CHARS = 1200


def normalize_text(text: str) -> str:
    if text is None:
        return ""
    text = str(text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def read_jsonl(path):
    rows = []
    invalid_count = 0

    if not os.path.exists(path):
        raise FileNotFoundError(f"Input file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                rows.append(obj)
            except json.JSONDecodeError:
                invalid_count += 1

    return rows, invalid_count


def write_jsonl(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def infer_task_type(instruction: str, output: str) -> str:
    instruction_l = instruction.lower()
    output_l = output.lower()

    extraction_markers = [
        "extract",
        "identify and list",
        "structured information",
        "patient details",
        "return the specified health information",
    ]

    reasoning_markers = [
        "analyze the symptoms",
        "non-diagnostic explanation",
        "associated with",
        "health reasoning",
        "possible symptom-based explanation",
        "possible association:",
        "concern level:",
        "advice:",
    ]

    qa_markers = [
        "answer the healthcare question",
        "educational explanation",
        "patient-friendly language",
        "medical term",
        "without giving treatment advice",
    ]

    if any(marker in instruction_l for marker in extraction_markers):
        return "extraction"

    if (
        "possible association:" in output_l
        or "concern level:" in output_l
        or "advice:" in output_l
        or any(marker in instruction_l for marker in reasoning_markers)
    ):
        return "reasoning"

    if any(marker in instruction_l for marker in qa_markers):
        return "qa"

    # fallback heuristics
    if "\n" in output and any(
        field in output_l
        for field in [
            "symptoms:",
            "duration:",
            "severity:",
            "age:",
            "gender:",
            "temperature:",
            "pulse:",
            "blood pressure:",
            "oxygen saturation:",
            "history:",
            "allergies:",
        ]
    ):
        return "extraction"

    if "may be associated with" in output_l or "not enough to make a diagnosis" in output_l:
        return "reasoning"

    return "qa"


def is_empty_or_invalid(record):
    required_fields = ["instruction", "input", "output"]
    for field in required_fields:
        if field not in record:
            return True
        if not isinstance(record[field], str):
            return True
        if not normalize_text(record[field]):
            return True
    return False


def has_bad_length(instruction: str, input_text: str, output_text: str) -> bool:
    total_chars = len(instruction) + len(input_text) + len(output_text)

    if len(input_text) < MIN_INPUT_CHARS:
        return True
    if len(output_text) < MIN_OUTPUT_CHARS:
        return True
    if len(input_text) > MAX_INPUT_CHARS:
        return True
    if len(output_text) > MAX_OUTPUT_CHARS:
        return True
    if total_chars > MAX_TOTAL_CHARS:
        return True

    return False


def contains_unsafe_content(output_text: str) -> bool:
    text = output_text.lower()

    banned_patterns = [
        "take 500 mg",
        "take paracetamol",
        "take ibuprofen",
        "you have pneumonia",
        "you have diabetes",
        "you definitely have",
        "this definitely means",
        "this confirms",
        "start antibiotics",
        "use this medicine",
        "prescription:",
        "dose:",
        "dosage:",
        "cures cancer",
        "no need to see a doctor",
    ]

    return any(pattern in text for pattern in banned_patterns)


def too_repetitive(text: str) -> bool:
    tokens = re.findall(r"\w+", text.lower())
    if len(tokens) < 8:
        return False

    counts = Counter(tokens)
    most_common_word, most_common_count = counts.most_common(1)[0]

    # if one word dominates too much, treat as noisy/repetitive
    if most_common_count / len(tokens) > 0.35:
        return True

    # repeated identical line fragments
    if len(set(tokens)) <= max(3, int(0.2 * len(tokens))):
        return True

    return False


def deduplicate_records(records):
    unique = []
    seen = set()
    removed = 0

    for record in records:
        key = (
            record["instruction"].strip().lower(),
            record["input"].strip().lower(),
            record["output"].strip().lower(),
        )
        if key in seen:
            removed += 1
            continue
        seen.add(key)
        unique.append(record)

    return unique, removed


def clean_records(raw_records):
    cleaned = []

    stats = {
        "empty_or_invalid_removed": 0,
        "bad_length_removed": 0,
        "unsafe_removed": 0,
        "repetitive_removed": 0,
    }

    for record in raw_records:
        if is_empty_or_invalid(record):
            stats["empty_or_invalid_removed"] += 1
            continue

        instruction = normalize_text(record["instruction"])
        input_text = normalize_text(record["input"])
        output_text = normalize_text(record["output"])

        if has_bad_length(instruction, input_text, output_text):
            stats["bad_length_removed"] += 1
            continue

        if contains_unsafe_content(output_text):
            stats["unsafe_removed"] += 1
            continue

        if too_repetitive(output_text):
            stats["repetitive_removed"] += 1
            continue

        task_type = infer_task_type(instruction, output_text)

        cleaned.append({
            "instruction": instruction,
            "input": input_text,
            "output": output_text,
            "task_type": task_type,
        })

    return cleaned, stats


def balance_records(records):
    grouped = {"qa": [], "reasoning": [], "extraction": []}

    for record in records:
        task_type = record["task_type"]
        if task_type in grouped:
            grouped[task_type].append(record)

    for task_type in grouped:
        random.shuffle(grouped[task_type])

    balanced = []
    final_counts = {}

    for task_type, target in TARGET_COUNTS.items():
        selected = grouped[task_type][:target]
        balanced.extend(selected)
        final_counts[task_type] = len(selected)

    random.shuffle(balanced)
    return balanced, final_counts, grouped


def split_train_val(records):
    grouped = {"qa": [], "reasoning": [], "extraction": []}
    for record in records:
        grouped[record["task_type"]].append(record)

    train_rows = []
    val_rows = []

    for task_type in ["qa", "reasoning", "extraction"]:
        rows = grouped[task_type]
        random.shuffle(rows)

        val_n = VAL_COUNTS[task_type]
        val_subset = rows[:val_n]
        train_subset = rows[val_n:]

        val_rows.extend(val_subset)
        train_rows.extend(train_subset)

    random.shuffle(train_rows)
    random.shuffle(val_rows)

    return train_rows, val_rows


def strip_task_type(records):
    return [
        {
            "instruction": r["instruction"],
            "input": r["input"],
            "output": r["output"],
        }
        for r in records
    ]


def print_summary(
    invalid_json_count,
    raw_count,
    cleaned_count_before_dedupe,
    deduped_count,
    clean_stats,
    duplicate_removed,
    grouped_before_balance,
    final_counts,
    train_rows,
    val_rows,
):
    print("\n========== DATA CLEANING SUMMARY ==========")
    print(f"Raw rows read: {raw_count}")
    print(f"Invalid JSON lines skipped: {invalid_json_count}")
    print(f"Removed empty/invalid records: {clean_stats['empty_or_invalid_removed']}")
    print(f"Removed bad length records: {clean_stats['bad_length_removed']}")
    print(f"Removed unsafe records: {clean_stats['unsafe_removed']}")
    print(f"Removed repetitive/noisy records: {clean_stats['repetitive_removed']}")
    print(f"Rows after cleaning (before dedupe): {cleaned_count_before_dedupe}")
    print(f"Exact duplicates removed: {duplicate_removed}")
    print(f"Rows after dedupe: {deduped_count}")

    print("\nAvailable category counts before balancing:")
    for task_type in ["qa", "reasoning", "extraction"]:
        print(f"  {task_type}: {len(grouped_before_balance[task_type])}")

    print("\nFinal balanced counts:")
    for task_type in ["qa", "reasoning", "extraction"]:
        print(f"  {task_type}: {final_counts.get(task_type, 0)}")

    print(f"\nTrain rows: {len(train_rows)}")
    print(f"Val rows: {len(val_rows)}")

    train_counter = Counter(infer_task_type(r["instruction"], r["output"]) for r in train_rows)
    val_counter = Counter(infer_task_type(r["instruction"], r["output"]) for r in val_rows)

    print("\nTrain split category counts:")
    for task_type in ["qa", "reasoning", "extraction"]:
        print(f"  {task_type}: {train_counter.get(task_type, 0)}")

    print("\nVal split category counts:")
    for task_type in ["qa", "reasoning", "extraction"]:
        print(f"  {task_type}: {val_counter.get(task_type, 0)}")

    print("\nFiles written:")
    print(f"  Cleaned dataset: {CLEANED_PATH}")
    print(f"  Train dataset:   {TRAIN_PATH}")
    print(f"  Val dataset:     {VAL_PATH}")
    print("===========================================\n")


def main():
    raw_records, invalid_json_count = read_jsonl(RAW_PATH)
    raw_count = len(raw_records)

    cleaned_records, clean_stats = clean_records(raw_records)
    cleaned_count_before_dedupe = len(cleaned_records)

    deduped_records, duplicate_removed = deduplicate_records(cleaned_records)
    deduped_count = len(deduped_records)

    balanced_records, final_counts, grouped_before_balance = balance_records(deduped_records)

    # if some category is short, user should know honestly
    for task_type, target in TARGET_COUNTS.items():
        if final_counts.get(task_type, 0) < target:
            print(
                f"Warning: only {final_counts.get(task_type, 0)} records available for '{task_type}', "
                f"target was {target}."
            )

    train_rows, val_rows = split_train_val(balanced_records)

    cleaned_no_task = strip_task_type(balanced_records)
    train_no_task = strip_task_type(train_rows)
    val_no_task = strip_task_type(val_rows)

    write_jsonl(CLEANED_PATH, cleaned_no_task)
    write_jsonl(TRAIN_PATH, train_no_task)
    write_jsonl(VAL_PATH, val_no_task)

    print_summary(
        invalid_json_count=invalid_json_count,
        raw_count=raw_count,
        cleaned_count_before_dedupe=cleaned_count_before_dedupe,
        deduped_count=deduped_count,
        clean_stats=clean_stats,
        duplicate_removed=duplicate_removed,
        grouped_before_balance=grouped_before_balance,
        final_counts=final_counts,
        train_rows=train_no_task,
        val_rows=val_no_task,
    )


if __name__ == "__main__":
    main()