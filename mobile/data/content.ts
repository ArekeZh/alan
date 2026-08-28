import { Exercise, Lesson, Module, Section } from '../types';

function computeAnswer(type: Exercise['type'], a: number, b: number) {
  if (type === 'addition') {
    return a + b;
  }
  if (type === 'subtraction') {
    return a - b;
  }
  if (type === 'multiplication') {
    return a * b;
  }
  return a / b;
}

function makeExercise(
  id: string,
  type: Exercise['type'],
  a: number,
  b: number,
): Exercise {
  const answer = computeAnswer(type, a, b);
  const distractors = new Set<number>();

  while (distractors.size < 3) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const candidate = answer + (distractors.size % 2 === 0 ? offset : -offset);
    if (candidate >= 0 && candidate !== answer) {
      distractors.add(candidate);
    }
  }

  const options = [answer, ...Array.from(distractors)].sort(() => Math.random() - 0.5);

  return { id, type, a, b, options };
}

export const modules: Module[] = [
  {
    id: 'module-basic',
    translationKey: 'modules.basicArithmetic',
    descriptionKey: 'modules.basicArithmetic.description',
    sectionIds: ['section-add-subtract', 'section-multiply', 'section-divide'],
  },
];

export const sections: Section[] = [
  {
    id: 'section-add-subtract',
    moduleId: 'module-basic',
    translationKey: 'sections.addSubtract',
    descriptionKey: 'sections.addSubtract.description',
    lessonIds: ['lesson-addition', 'lesson-subtraction', 'lesson-mixed'],
    voiceAliases: [
      'қосу',
      'алу',
      'сложение',
      'вычитание',
      'addition',
      'subtraction',
      'add',
      'subtract',
    ],
  },
  {
    id: 'section-multiply',
    moduleId: 'module-basic',
    translationKey: 'sections.multiply',
    descriptionKey: 'sections.multiply.description',
    lessonIds: ['lesson-multiplication'],
    voiceAliases: [
      'көбейту',
      'кобейту',
      'умножение',
      'умножения',
      'multiplication',
      'multiply',
    ],
  },
  {
    id: 'section-divide',
    moduleId: 'module-basic',
    translationKey: 'sections.divide',
    descriptionKey: 'sections.divide.description',
    lessonIds: ['lesson-division'],
    voiceAliases: ['бөлу', 'деление', 'деления', 'division', 'divide'],
  },
];

export const lessons: Lesson[] = [
  {
    id: 'lesson-addition',
    sectionId: 'section-add-subtract',
    translationKey: 'lessons.additionBasics',
    descriptionKey: 'lessons.additionBasics.description',
    exercises: [
      makeExercise('add-1', 'addition', 2, 1),
      makeExercise('add-2', 'addition', 3, 2),
      makeExercise('add-3', 'addition', 4, 4),
      makeExercise('add-4', 'addition', 1, 5),
      makeExercise('add-5', 'addition', 7, 2),
    ],
  },
  {
    id: 'lesson-subtraction',
    sectionId: 'section-add-subtract',
    translationKey: 'lessons.subtractionBasics',
    descriptionKey: 'lessons.subtractionBasics.description',
    exercises: [
      makeExercise('sub-1', 'subtraction', 5, 2),
      makeExercise('sub-2', 'subtraction', 8, 3),
      makeExercise('sub-3', 'subtraction', 10, 4),
      makeExercise('sub-4', 'subtraction', 7, 1),
      makeExercise('sub-5', 'subtraction', 9, 5),
    ],
  },
  {
    id: 'lesson-mixed',
    sectionId: 'section-add-subtract',
    translationKey: 'lessons.mixedPractice',
    descriptionKey: 'lessons.mixedPractice.description',
    exercises: [
      makeExercise('mix-1', 'addition', 3, 4),
      makeExercise('mix-2', 'subtraction', 8, 3),
      makeExercise('mix-3', 'addition', 2, 6),
      makeExercise('mix-4', 'subtraction', 10, 7),
      makeExercise('mix-5', 'addition', 4, 5),
    ],
  },
  {
    id: 'lesson-multiplication',
    sectionId: 'section-multiply',
    translationKey: 'lessons.multiplicationBasics',
    descriptionKey: 'lessons.multiplicationBasics.description',
    exercises: [
      makeExercise('mul-1', 'multiplication', 2, 3),
      makeExercise('mul-2', 'multiplication', 3, 3),
      makeExercise('mul-3', 'multiplication', 4, 2),
      makeExercise('mul-4', 'multiplication', 5, 2),
      makeExercise('mul-5', 'multiplication', 3, 4),
    ],
  },
  {
    id: 'lesson-division',
    sectionId: 'section-divide',
    translationKey: 'lessons.divisionBasics',
    descriptionKey: 'lessons.divisionBasics.description',
    exercises: [
      makeExercise('div-1', 'division', 6, 2),
      makeExercise('div-2', 'division', 8, 2),
      makeExercise('div-3', 'division', 9, 3),
      makeExercise('div-4', 'division', 10, 5),
      makeExercise('div-5', 'division', 12, 4),
    ],
  },
];

export function getModule(id: string) {
  return modules.find((module) => module.id === id);
}

export function getSection(id: string) {
  return sections.find((section) => section.id === id);
}

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id);
}

export function getSectionsForModule(moduleId: string) {
  const module = getModule(moduleId);
  if (!module) {
    return sections.filter((section) => section.moduleId === moduleId);
  }

  return module.sectionIds
    .map((sectionId) => sections.find((section) => section.id === sectionId))
    .filter((section): section is Section => Boolean(section));
}

export function getLessonsForSection(sectionId: string) {
  return lessons.filter((lesson) => lesson.sectionId === sectionId);
}

export function getCorrectAnswer(exercise: Exercise) {
  return computeAnswer(exercise.type, exercise.a, exercise.b);
}
