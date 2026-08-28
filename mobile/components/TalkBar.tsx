import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '../constants/theme';
import { useVoiceAssistantState } from '../hooks/VoiceAssistantContext';
import { useLanguage } from '../i18n/LanguageContext';

export function TalkBar() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { status, recognitionAvailable, toggleTalk } = useVoiceAssistantState();
  const isListening = status === 'listening';
  const isBusy = status === 'thinking' || !recognitionAvailable;
  const label = isListening ? t('voice.tapToStop') : t('voice.tapToSpeak');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isBusy, busy: isListening }}
      disabled={isBusy}
      onPress={toggleTalk}
      style={({ pressed }) => [
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 12) },
        pressed && !isBusy && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
});
