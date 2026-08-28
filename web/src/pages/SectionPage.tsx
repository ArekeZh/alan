import { useNavigate, useParams } from 'react-router';

import { CardButton } from '../components/CardButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { getLessonsForSection, getSection } from '../data/content';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useLanguage } from '../i18n/LanguageContext';

export function SectionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getLessonStatus } = useLessonProgress();

  const section = getSection(id);
  const sectionLessons = getLessonsForSection(id);

  if (!section) {
    return null;
  }

  const sectionTitle = t(`${section.translationKey}.title`);
  const sectionDescription = t(section.descriptionKey);

  return (
    <main className="screen">
      <ScreenHeader showBack title={sectionTitle} subtitle={sectionDescription} />

      <p className="section-label">{t('common.lesson')}</p>

      {sectionLessons.map((lesson, index) => {
        const title = t(`${lesson.translationKey}.title`);
        const description = t(lesson.descriptionKey);
        const status = getLessonStatus(lesson.id);

        const badge = status?.completed
          ? t('common.completed')
          : status
            ? `${status.score}/${lesson.exercises.length}`
            : t('common.notStarted');

        return (
          <CardButton
            key={lesson.id}
            title={`${index + 1}. ${title}`}
            description={description}
            badge={badge}
            accessibilityLabel={`${t('common.lesson')} ${index + 1}. ${title}. ${description}. ${badge}`}
            accessibilityHint={t('common.openLesson')}
            onPress={() => void navigate(`/lesson/${lesson.id}`)}
          />
        );
      })}
    </main>
  );
}
