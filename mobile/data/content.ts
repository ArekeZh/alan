import { Exercise, Lesson, Module, Section } from '../types';

function makeExercise(
  id: string,
  type: Exercise['type'],
  a: number,
  b: number,
): Exercise {
  const answer = type === 'addition' ? a + b : a - b;
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
    sectionIds: ['section-add-subtract'],
  },
];

export const sections: Section[] = [
  {
    id: 'section-add-subtract',
    moduleId: 'module-basic',
    translationKey: 'sections.addSubtract',
    descriptionKey: 'sections.addSubtract.description',
    lessonIds: ['lesson-addition', 'lesson-subtraction', 'lesson-mixed'],
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
  return sections.filter((section) => section.moduleId === moduleId);
}

export function getLessonsForSection(sectionId: string) {
  return lessons.filter((lesson) => lesson.sectionId === sectionId);
}

export function getCorrectAnswer(exercise: Exercise) {
  return exercise.type === 'addition' ? exercise.a + exercise.b : exercise.a - exercise.b;
}
