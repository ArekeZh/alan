def compute_answer(t, a, b):
    if t == "addition":
        return a + b
    if t == "subtraction":
        return a - b
    if t == "multiplication":
        return a * b
    return a // b


def make_options(t, a, b):
    answer = compute_answer(t, a, b)
    distractors = set()
    while len(distractors) < 3:
        offset = (len(distractors) % 3) + 1
        candidate = answer + (offset if len(distractors) % 2 == 0 else -offset)
        if candidate >= 0 and candidate != answer:
            distractors.add(candidate)
    return sorted([answer, *distractors])


exercises = [
    ("add-1", "addition", 2, 1),
    ("add-2", "addition", 3, 2),
    ("add-3", "addition", 4, 4),
    ("add-4", "addition", 1, 5),
    ("add-5", "addition", 7, 2),
    ("sub-1", "subtraction", 5, 2),
    ("sub-2", "subtraction", 8, 3),
    ("sub-3", "subtraction", 10, 4),
    ("sub-4", "subtraction", 7, 1),
    ("sub-5", "subtraction", 9, 5),
    ("mix-1", "addition", 3, 4),
    ("mix-2", "subtraction", 8, 3),
    ("mix-3", "addition", 2, 6),
    ("mix-4", "subtraction", 10, 7),
    ("mix-5", "addition", 4, 5),
    ("mul-1", "multiplication", 2, 3),
    ("mul-2", "multiplication", 3, 3),
    ("mul-3", "multiplication", 4, 2),
    ("mul-4", "multiplication", 5, 2),
    ("mul-5", "multiplication", 3, 4),
    ("div-1", "division", 6, 2),
    ("div-2", "division", 8, 2),
    ("div-3", "division", 9, 3),
    ("div-4", "division", 10, 5),
    ("div-5", "division", 12, 4),
]

for eid, t, a, b in exercises:
    print(f"{eid}: {make_options(t, a, b)}")
