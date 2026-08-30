import type { ContentBundle } from '../api/content';
import type { Exercise, Lesson, Module, Section } from '../types';

let bundle: ContentBundle | null = null;

export function setContentBundle(nextBundle: ContentBundle) {
  bundle = nextBundle;
}

export function clearContentBundle() {
  bundle = null;
}

export function getModules(): Module[] {
  return bundle?.modules ?? [];
}

export function getModule(id: string) {
  return bundle?.modules.find((item) => item.id === id);
}

export function getSection(id: string) {
  return bundle?.sections.find((item) => item.id === id);
}

export function getLesson(id: string) {
  return bundle?.lessons.find((item) => item.id === id);
}

export function getSectionsForModule(moduleId: string) {
  const module = getModule(moduleId);
  if (!module) {
    return bundle?.sections.filter((section) => section.moduleId === moduleId) ?? [];
  }

  return module.sectionIds
    .map((sectionId) => getSection(sectionId))
    .filter((section): section is Section => Boolean(section));
}

export function getLessonsForSection(sectionId: string) {
  const section = getSection(sectionId);
  if (!section) {
    return bundle?.lessons.filter((lesson) => lesson.sectionId === sectionId) ?? [];
  }

  return section.lessonIds
    .map((lessonId) => getLesson(lessonId))
    .filter((lesson): lesson is Lesson => Boolean(lesson));
}

export function getCorrectAnswer(exercise: Exercise) {
  if (exercise.type === 'counting') {
    return exercise.a;
  }
  if (exercise.type === 'addition') {
    return exercise.a + exercise.b;
  }
  if (exercise.type === 'subtraction') {
    return exercise.a - exercise.b;
  }
  if (exercise.type === 'multiplication') {
    return exercise.a * exercise.b;
  }
  return exercise.a / exercise.b;
}

export function lessonHasIntroVideo(lesson: Lesson | undefined) {
  return Boolean(lesson?.videoUrl);
}

export const modules = new Proxy([] as Module[], {
  get(_target, prop) {
    const list = getModules();
    const value = Reflect.get(list, prop, list);
    return typeof value === 'function' ? value.bind(list) : value;
  },
});
