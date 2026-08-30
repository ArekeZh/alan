import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountCard } from '../components/AccountCard';
import { CardButton } from '../components/CardButton';
import { LanguagePicker } from '../components/LanguagePicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { VoiceStatusCard } from '../components/VoiceStatusCard';
import { colors, spacing, typography } from '../constants/theme';
import { useContent } from '../hooks/ContentContext';
import { useVoiceAssistantState } from '../hooks/VoiceAssistantContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function HomeScreen() {
  const { t } = useLanguage();
  const voice = useVoiceAssistantState();
  const { isReady, error, modules } = useContent();

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />
          <ActivityIndicator size="large" color={colors.primary} />
          <Text>{t('common.loading')}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />
          <Text style={styles.error}>{error}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />

        <AccountCard />

        <VoiceStatusCard
          status={voice.status}
          transcript={voice.transcript}
          recognitionAvailable={voice.recognitionAvailable}
          onRepeat={voice.repeatGreeting}
          onListen={voice.toggleTalk}
        />

        <LanguagePicker />

        <Text style={styles.sectionTitle}>{t('common.module')}</Text>

        {modules.map((module) => (
          <CardButton
            key={module.id}
            title={module.title}
            description={module.description}
            badge={`${module.sectionIds.length} ${t('common.section')}`}
            accessibilityLabel={`${module.title}. ${module.description}`}
            accessibilityHint={t('common.openModule')}
            onPress={() => router.push(`/module/${module.id}`)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: typography.body,
  },
});
