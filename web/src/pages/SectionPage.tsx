import { useNavigate, useParams } from 'react-router';

import { CardButton } from '../components/CardButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { getLessonsForSection, getSection } from '../data/content';
import { useContent } from '../hooks/ContentContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useLanguage } from '../i18n/LanguageContext';

export function SectionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isReady } = useContent();
  const { getLessonStatus } = useLessonProgress();

  const section = getSection(id);
  const sectionLessons = getLessonsForSection(id);

  if (!isReady || !section) {
    return null;
  }

  return (
    <main className="screen">
      <ScreenHeader showBack title={section.title} subtitle={section.description} />

      <p className="section-label">{t('common.lesson')}</p>

      {sectionLessons.map((lesson, index) => {
        const status = getLessonStatus(lesson.id);

        const badge = status?.completed
          ? t('common.completed')
          : status
            ? `${status.score}/${lesson.exercises.length}`
            : t('common.notStarted');

        return (
          <CardButton
            key={lesson.id}
            title={`${index + 1}. ${lesson.title}`}
            description={lesson.description}
            badge={badge}
            accessibilityLabel={`${t('common.lesson')} ${index + 1}. ${lesson.title}. ${lesson.description}. ${badge}`}
            accessibilityHint={t('common.openLesson')}
            onPress={() => void navigate(`/lesson/${lesson.id}`)}
          />
        );
      })}
    </main>
  );
}
