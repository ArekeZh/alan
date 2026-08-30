import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { colors, spacing, typography } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { interruptSpeechForNavigation } from '../utils/navigationSpeech';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, showBack = false }: ScreenHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => {
            void interruptSpeechForNavigation();
            router.back();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    gap: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 4,
  },
  backText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 26,
  },
});
