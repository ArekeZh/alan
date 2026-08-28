import type { VoiceStatus } from '../hooks/useVoiceAssistant';
import { useLanguage } from '../i18n/LanguageContext';
import { AccessibleButton } from './AccessibleButton';

type VoiceStatusCardProps = {
  status: VoiceStatus;
  transcript: string;
  recognitionAvailable: boolean;
  onRepeat: () => void;
  onListen: () => void;
};

export function VoiceStatusCard({
  status,
  transcript,
  recognitionAvailable,
  onRepeat,
  onListen,
}: VoiceStatusCardProps) {
  const { t } = useLanguage();

  const statusLabel =
    status === 'speaking'
      ? t('voice.speaking')
      : status === 'listening'
        ? t('voice.listening')
        : status === 'waiting'
          ? t('voice.waiting')
          : status === 'thinking'
            ? t('voice.thinking')
            : status === 'error'
              ? t('voice.error')
              : t('voice.idle');

  const listenDisabled = !recognitionAvailable || status === 'thinking';

  return (
    <section
      className="voice-card"
      aria-live="polite"
      aria-label={`${statusLabel}${transcript ? `. ${t('voice.heard')}: ${transcript}` : ''}`}
    >
      <p className="section-label">{t('voice.assistant')}</p>
      <p className="voice-status">{statusLabel}</p>
      {!recognitionAvailable ? (
        <p className="voice-transcript">{t('voice.unavailable')}</p>
      ) : null}
      {transcript ? (
        <p className="voice-transcript">
          {t('voice.heard')}: {transcript}
        </p>
      ) : null}

      <div className="voice-actions">
        <AccessibleButton label={t('voice.repeat')} onPress={onRepeat} variant="secondary" />
        <AccessibleButton
          label={status === 'listening' ? t('voice.stopListening') : t('voice.listen')}
          onPress={onListen}
          disabled={listenDisabled}
        />
      </div>
    </section>
  );
}
