export type Language = 'kk' | 'ru' | 'en';

export type ExerciseType = 'addition' | 'subtraction';

export type Exercise = {
  id: string;
  type: ExerciseType;
  a: number;
  b: number;
  options: number[];
};

export type Lesson = {
  id: string;
  sectionId: string;
  translationKey: string;
  descriptionKey: string;
  exercises: Exercise[];
};

export type Section = {
  id: string;
  moduleId: string;
  translationKey: string;
  descriptionKey: string;
  lessonIds: string[];
};

export type Module = {
  id: string;
  translationKey: string;
  descriptionKey: string;
  sectionIds: string[];
};

export type LessonProgress = Record<string, { completed: boolean; score: number }>;
