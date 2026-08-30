import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

import { CardButton } from '../components/CardButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { getModule, getSectionsForModule } from '../data/content';
import { useContent } from '../hooks/ContentContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useLanguage } from '../i18n/LanguageContext';

export function ModulePage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isReady } = useContent();
  const { setLastOpenedModule } = useLessonProgress();

  const module = getModule(id);
  const moduleSections = getSectionsForModule(id);

  useEffect(() => {
    if (id) {
      void setLastOpenedModule(id);
    }
  }, [id, setLastOpenedModule]);

  if (!isReady || !module) {
    return null;
  }

  return (
    <main className="screen">
      <ScreenHeader showBack title={module.title} subtitle={module.description} />

      <p className="section-label">{t('common.section')}</p>

      {moduleSections.map((section, index) => (
        <CardButton
          key={section.id}
          title={`${index + 1}. ${section.title}`}
          description={section.description}
          badge={`${section.lessonIds.length} ${t('common.lesson')}`}
          accessibilityLabel={`${t('common.section')} ${index + 1}. ${section.title}. ${section.description}`}
          accessibilityHint={t('common.openSection')}
          onPress={() => void navigate(`/section/${section.id}`)}
        />
      ))}
    </main>
  );
}
