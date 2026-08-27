import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import { VoiceStatus } from '../hooks/useVoiceAssistant';
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

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${statusLabel}${transcript ? `. ${t('voice.heard')}: ${transcript}` : ''}`}
      style={styles.card}
    >
      <Text style={styles.label}>{t('voice.assistant')}</Text>
      <Text style={styles.status}>{statusLabel}</Text>
      {transcript ? (
        <Text style={styles.transcript}>
          {t('voice.heard')}: {transcript}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <AccessibleButton
          label={t('voice.repeat')}
          onPress={onRepeat}
          variant="secondary"
          style={styles.action}
        />
        <AccessibleButton
          label={t('voice.listen')}
          onPress={onListen}
          disabled={!recognitionAvailable || status === 'speaking' || status === 'listening' || status === 'thinking'}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  status: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 30,
  },
  transcript: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  action: {
    width: '100%',
  },
});
