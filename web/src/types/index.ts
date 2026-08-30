export type Language = 'kk' | 'ru' | 'en';

export type ExerciseType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'counting';

export type Exercise = {
  id: string;
  type: ExerciseType;
  a: number;
  b: number;
  code: string | null;
};

export type Lesson = {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  videoUrl: string | null;
  exercises: Exercise[];
};

export type Section = {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  lessonIds: string[];
  voiceAliases: string[];
};

export type Module = {
  id: string;
  title: string;
  description: string;
  sectionIds: string[];
};

export type LessonProgress = Record<string, { completed: boolean; score: number }>;

export type User = {
  id: number;
  nickname: string;
  created_at: string;
};

export type UserPreferences = {
  language: Language;
  last_opened_module_id: string | null;
};
