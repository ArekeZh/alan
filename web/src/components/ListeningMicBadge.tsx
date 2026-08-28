import { useVoiceListening } from '../hooks/useVoiceListening';
import { useLanguage } from '../i18n/LanguageContext';

export function ListeningMicBadge() {
  const { t } = useLanguage();
  const { isListening } = useVoiceListening();

  if (!isListening) {
    return null;
  }

  return (
    <div className="mic-badge" role="img" aria-live="polite" aria-label={t('voice.micOn')}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="mic-icon">
        <path
          fill="currentColor"
          d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
        />
      </svg>
    </div>
  );
}
