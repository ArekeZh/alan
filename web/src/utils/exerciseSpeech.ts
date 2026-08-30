import type { Exercise, Lesson } from '../types';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const MAX_SPOKEN_NUMBER = 20;

export function spokenNumber(value: number, t: TranslateFn): string {
  if (value >= 0 && value <= MAX_SPOKEN_NUMBER) {
    return t(`exercise.numbers.${value}`);
  }

  return String(value);
}

export function spokenExerciseProgress(
  current: number,
  total: number,
  t: TranslateFn,
): string {
  return t('exercise.exerciseProgressSpoken', {
    current: spokenNumber(current, t),
    total: spokenNumber(total, t),
  });
}

export function spokenQuestion(exercise: Exercise, t: TranslateFn): string {
  const questionKeyByType = {
    addition: 'exercise.questionAdditionSpoken',
    subtraction: 'exercise.questionSubtractionSpoken',
    multiplication: 'exercise.questionMultiplicationSpoken',
    division: 'exercise.questionDivisionSpoken',
    counting: 'exercise.questionCountingSpoken',
  } as const;

  if (exercise.type === 'counting') {
    return t(questionKeyByType.counting);
  }

  return t(questionKeyByType[exercise.type], {
    a: spokenNumber(exercise.a, t),
    b: spokenNumber(exercise.b, t),
  });
}

export function buildExerciseAnnouncement(
  lesson: Lesson,
  exerciseIndex: number,
  t: TranslateFn,
): string {
  const exercise = lesson.exercises[exerciseIndex];
  if (!exercise) {
    return '';
  }

  const progress = spokenExerciseProgress(exerciseIndex + 1, lesson.exercises.length, t);
  const instruction = t('exercise.sayAnswer');
  const question = spokenQuestion(exercise, t);

  return `${progress}. ${instruction}. ${question}`;
}
