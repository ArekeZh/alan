import { apiRequest } from './client';
import type { Exercise, Lesson, Module, Section } from '../types';

type ApiExercise = {
  id: string;
  type: Exercise['type'];
  a: number;
  b: number;
  code: string | null;
};

type ApiLesson = {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  exercises: ApiExercise[];
};

type ApiSection = {
  id: string;
  title: string;
  description: string;
  voice_aliases: string[];
  lessons: ApiLesson[];
};

type ApiModule = {
  id: string;
  title: string;
  description: string;
  sections: ApiSection[];
};

type ContentResponse = {
  modules: ApiModule[];
};

export type ContentBundle = {
  modules: Module[];
  sections: Section[];
  lessons: Lesson[];
};

function mapLesson(sectionId: string, lesson: ApiLesson): Lesson {
  return {
    id: lesson.id,
    sectionId,
    title: lesson.title,
    description: lesson.description,
    videoUrl: lesson.video_url || null,
    exercises: lesson.exercises.map((exercise) => ({
      ...exercise,
      code: exercise.code ?? null,
    })),
  };
}

function mapSection(moduleId: string, section: ApiSection): { section: Section; lessons: Lesson[] } {
  const lessons = section.lessons.map((lesson) => mapLesson(section.id, lesson));
  return {
    section: {
      id: section.id,
      moduleId,
      title: section.title,
      description: section.description,
      lessonIds: lessons.map((lesson) => lesson.id),
      voiceAliases: section.voice_aliases,
    },
    lessons,
  };
}

export async function fetchContent(language: string): Promise<ContentBundle> {
  const data = await apiRequest<ContentResponse>(`/content/?lang=${language}`, { auth: false });

  const modules: Module[] = [];
  const sections: Section[] = [];
  const lessons: Lesson[] = [];

  for (const apiModule of data.modules) {
    const mappedSections: Section[] = [];

    for (const apiSection of apiModule.sections) {
      const mapped = mapSection(apiModule.id, apiSection);
      mappedSections.push(mapped.section);
      lessons.push(...mapped.lessons);
    }

    modules.push({
      id: apiModule.id,
      title: apiModule.title,
      description: apiModule.description,
      sectionIds: mappedSections.map((section) => section.id),
    });
    sections.push(...mappedSections);
  }

  return { modules, sections, lessons };
}
