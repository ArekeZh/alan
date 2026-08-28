import { useVoiceAssistantState } from '../hooks/VoiceAssistantContext';
import { useLanguage } from '../i18n/LanguageContext';

export function StartOverlay() {
  const { t } = useLanguage();
  const { audioUnlocked, unlockAudioSession } = useVoiceAssistantState();

  if (audioUnlocked) {
    return null;
  }

  return (
    <button type="button" className="start-overlay" onClick={() => void unlockAudioSession()}>
      <span className="start-overlay-title">{t('voice.tapToStart')}</span>
      <span className="start-overlay-hint">{t('voice.tapToStartHint')}</span>
    </button>
  );
}
