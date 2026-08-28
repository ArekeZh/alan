import { getLesson, getModule, getSection } from '../data/content';

type Translate = (key: string) => string;

export function pathId(pathname: string, kind: 'module' | 'section' | 'lesson') {
  const match = pathname.match(new RegExp(`/${kind}/([^/?]+)`));
  return match?.[1];
}

export function getModuleIdFromPath(pathname: string) {
  const isInsideSection = Boolean(pathId(pathname, 'section') || pathId(pathname, 'lesson'));
  if (isInsideSection) {
    return undefined;
  }

  return pathId(pathname, 'module');
}

export function getPageTitleAfterGoingBack(pathname: string, t: Translate) {
  const lessonId = pathId(pathname, 'lesson');
  if (lessonId) {
    const lesson = getLesson(lessonId);
    const section = lesson ? getSection(lesson.sectionId) : undefined;
    if (section) {
      return t(`${section.translationKey}.title`);
    }
  }

  const sectionId = pathId(pathname, 'section');
  if (sectionId) {
    const section = getSection(sectionId);
    const module = section ? getModule(section.moduleId) : undefined;
    if (module) {
      return t(`${module.translationKey}.title`);
    }
  }

  return t('voice.homePageName');
}
