import { useNavigate } from 'react-router';

import { CardButton } from '../components/CardButton';
import { LanguagePicker } from '../components/LanguagePicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { VoiceStatusCard } from '../components/VoiceStatusCard';
import { modules } from '../data/content';
import { useVoiceAssistantState } from '../hooks/VoiceAssistantContext';
import { useLanguage } from '../i18n/LanguageContext';

export function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const voice = useVoiceAssistantState();

  return (
    <main className="screen">
      <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />

      <VoiceStatusCard
        status={voice.status}
        transcript={voice.transcript}
        recognitionAvailable={voice.recognitionAvailable}
        onRepeat={voice.repeatGreeting}
          onListen={() => voice.toggleTalk()}
      />

      <LanguagePicker />

      <p className="section-label">{t('common.module')}</p>

      {modules.map((module) => {
        const title = t(`${module.translationKey}.title`);
        const description = t(module.descriptionKey);

        return (
          <CardButton
            key={module.id}
            title={title}
            description={description}
            badge={`${module.sectionIds.length} ${t('common.section')}`}
            accessibilityLabel={`${title}. ${description}`}
            accessibilityHint={t('common.openModule')}
            onPress={() => void navigate(`/module/${module.id}`)}
          />
        );
      })}
    </main>
  );
}
