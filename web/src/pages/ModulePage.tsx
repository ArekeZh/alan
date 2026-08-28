import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

import { CardButton } from '../components/CardButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { getModule, getSectionsForModule } from '../data/content';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useLanguage } from '../i18n/LanguageContext';

export function ModulePage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setLastOpenedModule } = useLessonProgress();

  const module = getModule(id);
  const moduleSections = getSectionsForModule(id);

  useEffect(() => {
    if (id) {
      void setLastOpenedModule(id);
    }
  }, [id, setLastOpenedModule]);

  if (!module) {
    return null;
  }

  const moduleTitle = t(`${module.translationKey}.title`);
  const moduleDescription = t(module.descriptionKey);

  return (
    <main className="screen">
      <ScreenHeader showBack title={moduleTitle} subtitle={moduleDescription} />

      <p className="section-label">{t('common.section')}</p>

      {moduleSections.map((section, index) => {
        const title = t(`${section.translationKey}.title`);
        const description = t(section.descriptionKey);

        return (
          <CardButton
            key={section.id}
            title={`${index + 1}. ${title}`}
            description={description}
            badge={`${section.lessonIds.length} ${t('common.lesson')}`}
            accessibilityLabel={`${t('common.section')} ${index + 1}. ${title}. ${description}`}
            accessibilityHint={t('common.openSection')}
            onPress={() => void navigate(`/section/${section.id}`)}
          />
        );
      })}
    </main>
  );
}
