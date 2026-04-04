import os
import json
import random
from itertools import combinations

random.seed(42)

OUTPUT_PATH = "data/raw_dataset.jsonl"


# =========================================================
# CONFIG
# =========================================================
TARGET_QA = 420
TARGET_REASONING = 430
TARGET_EXTRACTION = 500


# =========================================================
# POOLS
# =========================================================
symptom_explanations = {
    "fever": "Fever is a temporary rise in body temperature, often related to infection or inflammation.",
    "cough": "Cough is a reflex that helps clear the airways of mucus, irritants, or infections.",
    "fatigue": "Fatigue is a feeling of tiredness or low energy that can happen for many different reasons.",
    "nausea": "Nausea is the sensation of feeling like you may vomit.",
    "vomiting": "Vomiting is the forceful emptying of stomach contents through the mouth.",
    "diarrhea": "Diarrhea refers to frequent loose or watery stools.",
    "headache": "Headache is pain or discomfort in the head that may vary in intensity and cause.",
    "dizziness": "Dizziness is a feeling of lightheadedness, unsteadiness, or imbalance.",
    "sore throat": "A sore throat is pain, irritation, or scratchiness in the throat.",
    "shortness of breath": "Shortness of breath is the feeling of difficulty breathing or not getting enough air.",
    "chest pain": "Chest pain is discomfort in the chest that can have many possible causes, some of which may be serious.",
    "abdominal pain": "Abdominal pain is discomfort in the area between the chest and pelvis.",
    "rash": "A rash is a change in the skin that may cause redness, itching, swelling, or bumps.",
    "palpitations": "Palpitations are feelings of a fast, pounding, or irregular heartbeat.",
    "frequent urination": "Frequent urination means needing to urinate more often than usual.",
    "increased thirst": "Increased thirst means feeling unusually thirsty more often than normal.",
    "wheezing": "Wheezing is a high-pitched whistling sound during breathing, often linked to narrowed airways.",
    "weakness": "Weakness is reduced physical strength or a general feeling of being less able to perform usual activities.",
    "chills": "Chills are feelings of coldness often accompanied by shivering, sometimes seen with fever.",
    "swelling": "Swelling is enlargement of body tissue caused by fluid buildup or inflammation.",
}

condition_explanations = {
    "hypertension": "Hypertension, or high blood pressure, is a condition in which the force of blood against the artery walls stays consistently high.",
    "diabetes": "Diabetes is a condition in which the body has difficulty controlling blood sugar levels.",
    "anemia": "Anemia is a condition in which the body does not have enough healthy red blood cells or hemoglobin.",
    "asthma": "Asthma is a chronic condition that affects the airways and can cause wheezing, cough, and breathing difficulty.",
    "dehydration": "Dehydration happens when the body loses more fluids than it takes in.",
    "allergy": "An allergy is an immune system reaction to a substance that is usually harmless to most people.",
    "infection": "An infection occurs when harmful microorganisms such as bacteria, viruses, or fungi enter and multiply in the body.",
    "migraine": "Migraine is a type of headache that may be severe and can be associated with nausea or sensitivity to light and sound.",
    "edema": "Edema is swelling caused by excess fluid trapped in the body's tissues.",
    "tachycardia": "Tachycardia refers to a faster-than-normal heart rate.",
}

vitals_explanations = {
    "blood pressure": "Blood pressure is the force of blood pushing against the walls of the arteries.",
    "heart rate": "Heart rate is the number of times the heart beats per minute.",
    "oxygen saturation": "Oxygen saturation is the percentage of oxygen-carrying hemoglobin in the blood.",
    "body temperature": "Body temperature is a measure of how warm the body is and can help indicate fever or low temperature states.",
    "BMI": "BMI, or Body Mass Index, is a simple calculation using height and weight to estimate body size.",
}

preventive_concepts = {
    "hydration": "Hydration is important because the body needs enough fluid for temperature regulation, circulation, digestion, and normal cell function.",
    "sleep": "Sleep is important because it helps the body recover, supports brain function, and strengthens overall health.",
    "exercise": "Regular exercise helps improve cardiovascular health, strength, energy levels, and overall well-being.",
    "hand hygiene": "Hand hygiene helps reduce the spread of infections by removing germs from the hands.",
    "vaccination": "Vaccination helps the immune system recognize and respond to certain infections more effectively.",
}

comparison_explanations = {
    "cold vs flu": "Both may cause cough and sore throat, but flu often causes more intense fever, body aches, and fatigue than a common cold.",
    "dizziness vs vertigo": "Dizziness is a broad feeling of lightheadedness or imbalance, while vertigo specifically refers to a spinning sensation.",
    "acute vs chronic pain": "Acute pain starts suddenly and usually lasts a short time, while chronic pain persists for a longer period.",
    "allergy vs infection symptoms": "Allergies often cause itching and sneezing without fever, while infections may cause fever, pain, and general illness.",
    "dehydration vs fatigue": "Dehydration is a fluid-balance problem that can cause fatigue, while fatigue itself is a symptom that may occur due to many causes.",
}

clinical_terms = {
    "SOB": "SOB stands for shortness of breath.",
    "afebrile": "Afebrile means not having a fever.",
    "edema": "Edema means swelling caused by fluid buildup in tissues.",
    "tachycardia": "Tachycardia means a faster-than-normal heart rate.",
    "non-productive cough": "A non-productive cough is a dry cough that does not bring up mucus.",
}

seek_help_questions = {
    "When should chest pain be medically evaluated?": "Chest pain should be medically evaluated, especially if it is severe, persistent, associated with shortness of breath, sweating, dizziness, or other concerning symptoms.",
    "When should a fever be checked by a doctor?": "A fever should be medically evaluated if it is very high, lasts several days, keeps returning, or occurs with concerning symptoms such as confusion, breathing difficulty, or dehydration.",
    "When should vomiting become a concern?": "Vomiting becomes more concerning if it is persistent, prevents fluid intake, causes dehydration, or happens with severe pain, weakness, or other worrying symptoms.",
    "When should breathing difficulty be treated urgently?": "Breathing difficulty should be treated urgently when it is severe, worsening, or associated with chest pain, bluish lips, confusion, or low oxygen levels.",
    "When should diarrhea be medically assessed?": "Diarrhea should be medically assessed if it is severe, prolonged, causes dehydration, or happens with blood, high fever, or significant weakness.",
}

symptoms = [
    "fever", "cough", "fatigue", "nausea", "vomiting", "diarrhea", "headache",
    "dizziness", "sore throat", "shortness of breath", "chest pain",
    "abdominal pain", "rash", "palpitations", "frequent urination",
    "increased thirst", "wheezing", "weakness", "chills", "swelling"
]

durations = [
    "for 1 day", "for 2 days", "for 3 days", "for 5 days", "for 1 week",
    "for 2 weeks", "since yesterday", "since this morning",
    "intermittently for a month", "worsening over 5 days"
]

severities = ["mild", "moderate", "severe", "persistent", "worsening", "intermittent"]

ages = [5, 8, 12, 18, 24, 30, 35, 42, 45, 52, 60, 68, 72]
genders = ["male", "female"]

history_items = [
    "history of asthma",
    "history of diabetes",
    "history of hypertension",
    "history of anemia",
    "history of migraine",
    "history of seasonal allergies",
]

allergies = [
    "allergy to penicillin",
    "allergy to sulfa drugs",
    "allergy to peanuts",
    "allergy to dust",
    "no known drug allergies",
]

medications = [
    "paracetamol",
    "ibuprofen",
    "an inhaler",
    "an antihistamine",
    "a blood pressure medication",
]

vitals_pool = [
    {"temperature": "101 F", "pulse": "104 bpm"},
    {"temperature": "102 F", "pulse": "112 bpm"},
    {"blood pressure": "150/95", "pulse": "98 bpm"},
    {"oxygen saturation": "93%", "pulse": "110 bpm"},
    {"oxygen saturation": "90%", "pulse": "118 bpm"},
    {"blood pressure": "130/85", "temperature": "99.8 F"},
]

qa_instruction_templates = [
    "Answer the healthcare question clearly and safely.",
    "Provide a simple educational explanation for the following health question.",
    "Explain the concept in patient-friendly language.",
    "Give a concise and accurate explanation of the following medical term.",
    "Answer in a neutral, educational tone without giving treatment advice.",
]

reasoning_instruction_templates = [
    "Analyze the symptoms and provide a safe, non-diagnostic explanation.",
    "Explain what these symptoms may be associated with in general terms.",
    "Review the symptom pattern and provide cautious health reasoning.",
    "Interpret the following case in an educational and non-definitive way.",
    "Provide a possible symptom-based explanation without making a final diagnosis.",
]

extraction_instruction_templates = [
    "Extract the requested clinical details from the text.",
    "Identify and list the symptoms mentioned in the note.",
    "Convert the clinical text into structured information.",
    "Extract the patient details mentioned below.",
    "Read the note and return the specified health information.",
]


# =========================================================
# HELPERS
# =========================================================
def normalize_text(text: str) -> str:
    return " ".join(text.split())


def write_jsonl(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def safe_reasoning_output(symptom_list, duration=None, severity=None, age=None, vitals=None):
    symptom_text = ", ".join(symptom_list)

    possible_map = {
        "fever": "infection or inflammation",
        "cough": "a respiratory infection or airway irritation",
        "sore throat": "an upper respiratory infection or throat irritation",
        "shortness of breath": "a respiratory or cardiovascular problem",
        "chest pain": "a potentially serious medical condition",
        "abdominal pain": "a digestive or inflammatory condition",
        "nausea": "a digestive issue, infection, or another systemic condition",
        "vomiting": "a stomach-related or systemic illness",
        "diarrhea": "an infection, irritation, or digestive imbalance",
        "fatigue": "an infection, anemia, dehydration, or another underlying condition",
        "increased thirst": "dehydration or high blood sugar",
        "frequent urination": "a urinary issue or high blood sugar",
        "dizziness": "dehydration, low blood pressure, anemia, or another medical issue",
        "palpitations": "stress, dehydration, or a heart rhythm issue",
        "wheezing": "airway narrowing such as asthma or another breathing-related problem",
        "swelling": "fluid retention, inflammation, or circulation-related issues",
        "rash": "allergy, irritation, or infection",
        "weakness": "fatigue, dehydration, anemia, or a broader medical issue",
        "chills": "fever or infection",
        "headache": "infection, dehydration, tension, or migraine-related causes",
    }

    associations = []
    for s in symptom_list:
        if s in possible_map:
            associations.append(possible_map[s])

    if not associations:
        assoc_text = "a medical condition that requires proper clinical evaluation"
    else:
        assoc_text = ", ".join(sorted(set(associations)))[:220]

    concern = "Low to moderate"
    advice = "This is not enough to make a diagnosis, but a healthcare professional can assess the symptoms properly."

    if "chest pain" in symptom_list or "shortness of breath" in symptom_list:
        concern = "Moderate to high"
        advice = "Because symptoms such as chest pain or breathing difficulty may be serious, prompt medical evaluation is advisable."

    if severity in ["severe", "worsening", "persistent"]:
        concern = "Moderate to high"
        advice = "Persistent, worsening, or severe symptoms deserve medical evaluation."

    if age is not None and age >= 68:
        concern = "Moderate to high"
        advice = "Older adults may require earlier medical assessment, especially if symptoms are persistent or worsening."

    if vitals:
        vitals_text = " ".join(f"{k} {v}" for k, v in vitals.items())
        if "oxygen saturation" in vitals and vitals["oxygen saturation"] in ["90%", "93%"]:
            concern = "High"
            advice = "Low oxygen saturation with symptoms can be concerning and should be medically evaluated promptly."
        elif "temperature" in vitals or "blood pressure" in vitals or "pulse" in vitals:
            concern = "Moderate"
        vitals_line = f"Vitals Context: {vitals_text}."
    else:
        vitals_line = ""

    duration_line = f"Duration Context: {duration}." if duration else ""
    age_line = f"Age Context: {age} years." if age is not None else ""

    output = (
        f"Possible Association: The symptom pattern of {symptom_text} may be associated with {assoc_text}.\n"
        f"Concern Level: {concern}.\n"
        f"{age_line}\n"
        f"{duration_line}\n"
        f"{vitals_line}\n"
        f"Advice: {advice}"
    )
    return normalize_text(output.replace(" \n", "\n")).strip()


def format_extraction_output(fields: dict):
    ordered_keys = [
        "Age",
        "Gender",
        "Symptoms",
        "Duration",
        "Severity",
        "Temperature",
        "Pulse",
        "Blood Pressure",
        "Oxygen Saturation",
        "Medication",
        "History",
        "Allergies",
    ]
    lines = []
    for key in ordered_keys:
        if key in fields and fields[key]:
            lines.append(f"{key}: {fields[key]}")
    return "\n".join(lines)


def unique_append(container, seen, item):
    key = (
        item["instruction"].strip().lower(),
        item["input"].strip().lower(),
        item["output"].strip().lower(),
    )
    if key not in seen:
        seen.add(key)
        container.append(item)


# =========================================================
# GENERATORS
# =========================================================
def generate_qa_samples():
    rows = []
    seen = set()

    def add_qa(instruction, inp, output):
        unique_append(rows, seen, {
            "instruction": instruction,
            "input": inp,
            "output": output,
            "task_type": "qa"
        })

    # 1. Symptom explanations
    for term, expl in symptom_explanations.items():
        question_variants = [
            f"What is {term}?",
            f"Explain {term}.",
            f"What does {term} mean in healthcare?",
            f"Give a simple explanation of {term}.",
        ]
        ending_variants = [
            "It may have many possible causes depending on the overall health context.",
            "Its importance depends on the full clinical picture and associated symptoms.",
            "The meaning and seriousness can vary depending on the person's condition.",
        ]
        for q in question_variants:
            for end in ending_variants:
                add_qa(
                    random.choice(qa_instruction_templates),
                    q,
                    f"{expl} {end}"
                )

    # 2. Condition explanations
    for term, expl in condition_explanations.items():
        question_variants = [
            f"What is {term}?",
            f"Explain {term} in simple terms.",
            f"What does {term} mean?",
            f"Give a patient-friendly explanation of {term}.",
        ]
        ending_variants = [
            "A proper medical evaluation helps determine severity and the right management approach.",
            "Its significance may differ depending on symptoms, test results, and medical history.",
            "Early understanding of the condition can help support timely medical care.",
        ]
        for q in question_variants:
            for end in ending_variants:
                add_qa(
                    random.choice(qa_instruction_templates),
                    q,
                    f"{expl} {end}"
                )

    # 3. Vital explanations
    for term, expl in vitals_explanations.items():
        question_variants = [
            f"What is {term}?",
            f"Explain {term}.",
            f"What does {term} measure?",
            f"Why is {term} important?",
        ]
        ending_variants = [
            "It is one of the measurements often used to understand a person's general health status.",
            "Doctors often use it together with symptoms and examination findings.",
            "By itself it gives useful information, but it is usually interpreted with other health data.",
        ]
        for q in question_variants:
            for end in ending_variants:
                add_qa(
                    random.choice(qa_instruction_templates),
                    q,
                    f"{expl} {end}"
                )

    # 4. Preventive health concepts
    for term, expl in preventive_concepts.items():
        question_variants = [
            f"Why is {term} important for health?",
            f"Explain the role of {term} in maintaining health.",
            f"Why does {term} matter in daily life?",
            f"How does {term} support overall well-being?",
        ]
        ending_variants = [
            "It is considered an important part of maintaining general health.",
            "This can help support both short-term and long-term well-being.",
            "Its benefits are often seen when practiced consistently over time.",
        ]
        for q in question_variants:
            for end in ending_variants:
                add_qa(
                    random.choice(qa_instruction_templates),
                    q,
                    f"{expl} {end}"
                )

    # 5. Comparisons
    for term, expl in comparison_explanations.items():
        question_variants = [
            f"What is the difference between {term}?",
            f"Compare {term}.",
            f"Explain {term} in simple language.",
            f"How are {term} different from each other?",
        ]
        ending_variants = [
            "The distinction becomes clearer when symptoms, duration, and context are considered.",
            "These terms may sound similar, but they are not exactly the same.",
            "Understanding the difference can help describe symptoms more clearly.",
        ]
        for q in question_variants:
            for end in ending_variants:
                add_qa(
                    random.choice(qa_instruction_templates),
                    q,
                    f"{expl} {end}"
                )

    # 6. Clinical terms
    for term, expl in clinical_terms.items():
        question_variants = [
            f"What does {term} mean?",
            f"Explain the term {term}.",
            f"What is meant by {term} in a clinical note?",
            f"Give a simple explanation of the term {term}.",
        ]
        ending_variants = [
            "This term is commonly used in healthcare communication.",
            "It may appear in patient notes, reports, or medical documentation.",
            "Understanding such terms helps in reading clinical information more clearly.",
        ]
        for q in question_variants:
            for end in ending_variants:
                add_qa(
                    random.choice(qa_instruction_templates),
                    q,
                    f"{expl} {end}"
                )

    # 7. Seek-help questions
    for q, ans in seek_help_questions.items():
        ending_variants = [
            "",
            "Persistent or worsening symptoms should not be ignored.",
            "The exact urgency depends on the full situation and associated symptoms.",
            "A healthcare professional can decide the right next step based on evaluation.",
        ]
        for end in ending_variants:
            output = f"{ans} {end}".strip()
            add_qa(
                random.choice(qa_instruction_templates),
                q,
                output
            )

    # 8. New subgroup: symptom causes/general meaning
    cause_templates = [
        "What are some common reasons for {term}?",
        "What can {term} be associated with?",
        "Why might someone experience {term}?",
        "What are possible general causes of {term}?",
    ]
    cause_endings = [
        "The exact cause depends on the person's health history, associated symptoms, and clinical evaluation.",
        "Some causes may be minor, while others may need medical attention.",
        "It is best interpreted in the context of other symptoms and duration.",
    ]
    generic_causes = {
        "fever": "Fever may be associated with infection, inflammation, or other conditions affecting the body.",
        "cough": "Cough may be associated with infection, allergy, irritation, or airway-related conditions.",
        "fatigue": "Fatigue may be associated with poor sleep, infection, anemia, stress, dehydration, or many other conditions.",
        "nausea": "Nausea may be associated with digestive issues, infection, medication effects, or other health problems.",
        "vomiting": "Vomiting may be associated with infection, stomach irritation, food-related illness, or other medical issues.",
        "diarrhea": "Diarrhea may be associated with infection, food intolerance, medication effects, or digestive problems.",
        "headache": "Headache may be associated with stress, dehydration, infection, migraine, or other medical causes.",
        "dizziness": "Dizziness may be associated with dehydration, low blood pressure, inner ear issues, anemia, or other causes.",
        "sore throat": "Sore throat may be associated with infection, dryness, irritation, or allergy-related causes.",
        "shortness of breath": "Shortness of breath may be associated with respiratory, cardiac, or other systemic conditions.",
        "chest pain": "Chest pain may be associated with muscle strain, digestive causes, respiratory issues, or serious cardiac conditions.",
        "abdominal pain": "Abdominal pain may be associated with digestive, inflammatory, infectious, or other abdominal conditions.",
        "rash": "A rash may be associated with allergy, irritation, infection, or inflammatory skin conditions.",
        "palpitations": "Palpitations may be associated with stress, caffeine, dehydration, anemia, or heart rhythm problems.",
        "frequent urination": "Frequent urination may be associated with infection, increased fluid intake, diabetes, or other urinary conditions.",
        "increased thirst": "Increased thirst may be associated with dehydration, high blood sugar, or fluid balance issues.",
        "wheezing": "Wheezing may be associated with narrowed airways, asthma, infection, or allergic reactions.",
        "weakness": "Weakness may be associated with fatigue, infection, dehydration, nutritional issues, or other conditions.",
        "chills": "Chills may be associated with fever, infection, or the body's response to illness.",
        "swelling": "Swelling may be associated with inflammation, injury, fluid retention, or circulation-related problems.",
    }

    for term, base_output in generic_causes.items():
        for q in cause_templates:
            for end in cause_endings:
                add_qa(
                    random.choice(qa_instruction_templates),
                    q.format(term=term),
                    f"{base_output} {end}"
                )

    random.shuffle(rows)
    return rows[:TARGET_QA]


def generate_reasoning_samples():
    rows = []
    seen = set()

    # Symptom cluster reasoning
    symptom_combos = list(combinations(symptoms, 3))
    random.shuffle(symptom_combos)

    for combo in symptom_combos[:220]:
        combo = list(combo)
        instruction = random.choice(reasoning_instruction_templates)
        duration = random.choice(durations)
        severity = random.choice(severities)

        input_text = f"A patient has {combo[0]}, {combo[1]}, and {combo[2]} {duration}. The symptoms are {severity}."
        output_text = safe_reasoning_output(combo, duration=duration, severity=severity)

        unique_append(rows, seen, {
            "instruction": instruction,
            "input": input_text,
            "output": output_text,
            "task_type": "reasoning"
        })

    # Age-aware reasoning
    for _ in range(80):
        combo = random.sample(symptoms, 2)
        age = random.choice(ages)
        gender = random.choice(genders)
        duration = random.choice(durations)

        instruction = random.choice(reasoning_instruction_templates)
        input_text = f"A {age}-year-old {gender} reports {combo[0]} and {combo[1]} {duration}."
        output_text = safe_reasoning_output(combo, duration=duration, age=age)

        unique_append(rows, seen, {
            "instruction": instruction,
            "input": input_text,
            "output": output_text,
            "task_type": "reasoning"
        })

    # Vitals-aware reasoning
    for _ in range(70):
        combo = random.sample(symptoms, 2)
        vitals = random.choice(vitals_pool)
        instruction = random.choice(reasoning_instruction_templates)

        vitals_text = ", ".join(f"{k} {v}" for k, v in vitals.items())
        input_text = f"The patient has {combo[0]} and {combo[1]}. Vital signs show {vitals_text}."
        output_text = safe_reasoning_output(combo, vitals=vitals)

        unique_append(rows, seen, {
            "instruction": instruction,
            "input": input_text,
            "output": output_text,
            "task_type": "reasoning"
        })

    # Clinical-note reasoning
    for _ in range(90):
        combo = random.sample(symptoms, 3)
        history = random.choice(history_items)
        age = random.choice(ages)
        gender = random.choice(genders)
        duration = random.choice(durations)

        instruction = random.choice(reasoning_instruction_templates)
        input_text = (
            f"Clinical note: A {age}-year-old {gender} presents with {combo[0]}, {combo[1]}, and {combo[2]} "
            f"{duration}. The patient has a {history}."
        )
        output_text = safe_reasoning_output(combo, duration=duration, age=age)

        unique_append(rows, seen, {
            "instruction": instruction,
            "input": input_text,
            "output": output_text,
            "task_type": "reasoning"
        })

    random.shuffle(rows)
    return rows[:TARGET_REASONING]


def generate_extraction_samples():
    rows = []
    seen = set()

    # 1. Symptom extraction
    for _ in range(160):
        combo = random.sample(symptoms, random.choice([2, 3, 4]))
        duration = random.choice(durations)
        note_templates = [
            f"The patient complains of {', '.join(combo)} {duration}.",
            f"Patient reports {', '.join(combo)} {duration}.",
            f"Clinical note: {', '.join(combo)} have been present {duration}.",
            f"The patient presents with {', '.join(combo)} {duration}.",
        ]
        input_text = random.choice(note_templates)

        output_text = format_extraction_output({
            "Symptoms": ", ".join(combo),
            "Duration": duration.replace("for ", "").replace("since ", "since "),
        })

        unique_append(rows, seen, {
            "instruction": "Identify and list the symptoms mentioned in the note.",
            "input": input_text,
            "output": output_text,
            "task_type": "extraction"
        })

    # 2. Full structured extraction
    for _ in range(180):
        age = random.choice(ages)
        gender = random.choice(genders)
        combo = random.sample(symptoms, random.choice([2, 3]))
        duration = random.choice(durations)
        severity = random.choice(severities)
        history = random.choice(history_items)
        allergy = random.choice(allergies)
        med = random.choice(medications)
        vitals = random.choice(vitals_pool)

        vitals_text = ", ".join(f"{k} {v}" for k, v in vitals.items())
        input_text = (
            f"A {age}-year-old {gender} presents with {severity} {combo[0]}"
            + (f", {combo[1]}" if len(combo) > 1 else "")
            + (f", and {combo[2]}" if len(combo) > 2 else "")
            + f" {duration}. History reveals {history}. Allergies: {allergy}. "
              f"The patient mentions taking {med}. Vital signs show {vitals_text}."
        )

        fields = {
            "Age": str(age),
            "Gender": gender,
            "Symptoms": ", ".join(combo),
            "Duration": duration.replace("for ", "").replace("since ", "since "),
            "Severity": severity,
            "Medication": med,
            "History": history.replace("history of ", ""),
            "Allergies": allergy.replace("allergy to ", "") if "allergy to " in allergy else allergy,
        }

        if "temperature" in vitals:
            fields["Temperature"] = vitals["temperature"]
        if "pulse" in vitals:
            fields["Pulse"] = vitals["pulse"]
        if "blood pressure" in vitals:
            fields["Blood Pressure"] = vitals["blood pressure"]
        if "oxygen saturation" in vitals:
            fields["Oxygen Saturation"] = vitals["oxygen saturation"]

        output_text = format_extraction_output(fields)

        unique_append(rows, seen, {
            "instruction": "Convert the clinical text into structured information.",
            "input": input_text,
            "output": output_text,
            "task_type": "extraction"
        })

    # 3. Vitals extraction
    for _ in range(80):
        vitals = random.choice(vitals_pool)
        combo = random.sample(symptoms, 2)
        input_text = (
            f"Clinical note: The patient has {combo[0]} and {combo[1]}. "
            + " ".join([f"{k.capitalize()} is {v}." for k, v in vitals.items()])
        )

        fields = {"Symptoms": ", ".join(combo)}
        if "temperature" in vitals:
            fields["Temperature"] = vitals["temperature"]
        if "pulse" in vitals:
            fields["Pulse"] = vitals["pulse"]
        if "blood pressure" in vitals:
            fields["Blood Pressure"] = vitals["blood pressure"]
        if "oxygen saturation" in vitals:
            fields["Oxygen Saturation"] = vitals["oxygen saturation"]

        output_text = format_extraction_output(fields)

        unique_append(rows, seen, {
            "instruction": random.choice(extraction_instruction_templates),
            "input": input_text,
            "output": output_text,
            "task_type": "extraction"
        })

    # 4. History/allergy extraction
    for _ in range(80):
        age = random.choice(ages)
        gender = random.choice(genders)
        history = random.choice(history_items)
        allergy = random.choice(allergies)
        combo = random.sample(symptoms, 2)

        input_text = (
            f"A {age}-year-old {gender} presents with {combo[0]} and {combo[1]}. "
            f"Past history: {history}. Allergy information: {allergy}."
        )

        output_text = format_extraction_output({
            "Age": str(age),
            "Gender": gender,
            "Symptoms": ", ".join(combo),
            "History": history.replace("history of ", ""),
            "Allergies": allergy.replace("allergy to ", "") if "allergy to " in allergy else allergy,
        })

        unique_append(rows, seen, {
            "instruction": "Extract the patient details mentioned below.",
            "input": input_text,
            "output": output_text,
            "task_type": "extraction"
        })

    random.shuffle(rows)
    return rows[:TARGET_EXTRACTION]


# =========================================================
# MAIN
# =========================================================
def main():
    qa_rows = generate_qa_samples()
    reasoning_rows = generate_reasoning_samples()
    extraction_rows = generate_extraction_samples()

    all_rows = qa_rows + reasoning_rows + extraction_rows
    random.shuffle(all_rows)

    # Final JSONL required format
    final_rows = []
    for row in all_rows:
        final_rows.append({
            "instruction": normalize_text(row["instruction"]),
            "input": normalize_text(row["input"]),
            "output": normalize_text(row["output"]),
        })

    write_jsonl(OUTPUT_PATH, final_rows)

    print(f"Dataset generated successfully: {OUTPUT_PATH}")
    print(f"QA samples: {len(qa_rows)}")
    print(f"Reasoning samples: {len(reasoning_rows)}")
    print(f"Extraction samples: {len(extraction_rows)}")
    print(f"Total raw samples: {len(final_rows)}")


if __name__ == "__main__":
    main()