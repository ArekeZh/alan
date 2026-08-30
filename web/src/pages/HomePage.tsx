import { useNavigate } from 'react-router';

import { AccountCard } from '../components/AccountCard';
import { CardButton } from '../components/CardButton';
import { LanguagePicker } from '../components/LanguagePicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { VoiceStatusCard } from '../components/VoiceStatusCard';
import { useVoiceAssistantState } from '../hooks/VoiceAssistantContext';
import { useContent } from '../hooks/ContentContext';
import { useLanguage } from '../i18n/LanguageContext';

export function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const voice = useVoiceAssistantState();
  const { isReady, error, modules } = useContent();

  if (!isReady) {
    return (
      <main className="screen">
        <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />
        <p>{t('common.loading')}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="screen">
        <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />
        <p className="account-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />

      <AccountCard />

      <VoiceStatusCard
        status={voice.status}
        transcript={voice.transcript}
        recognitionAvailable={voice.recognitionAvailable}
        onRepeat={voice.repeatGreeting}
        onListen={() => voice.toggleTalk()}
      />

      <LanguagePicker />

      <p className="section-label">{t('common.module')}</p>

      {modules.map((module) => (
        <CardButton
          key={module.id}
          title={module.title}
          description={module.description}
          badge={`${module.sectionIds.length} ${t('common.section')}`}
          accessibilityLabel={`${module.title}. ${module.description}`}
          accessibilityHint={t('common.openModule')}
          onPress={() => void navigate(`/module/${module.id}`)}
        />
      ))}
    </main>
  );
}
