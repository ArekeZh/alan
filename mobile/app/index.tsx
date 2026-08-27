import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardButton } from '../components/CardButton';
import { LanguagePicker } from '../components/LanguagePicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { VoiceStatusCard } from '../components/VoiceStatusCard';
import { colors, spacing, typography } from '../constants/theme';
import { getModule, modules } from '../data/content';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useLanguage } from '../i18n/LanguageContext';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isReady, lastOpenedModuleId } = useLessonProgress();
  const [screenFocused, setScreenFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );

  const firstModule = modules[0];
  const lastModule = lastOpenedModuleId ? getModule(lastOpenedModuleId) : undefined;
  const progressModule = lastModule ?? firstModule;
  const progressModuleTitle = t(`${progressModule.translationKey}.title`);

  const greeting = useMemo(() => {
    const progressLine = lastModule
      ? t('voice.progressAtModule', { module: progressModuleTitle })
      : t('voice.progressNotStarted', { module: progressModuleTitle });

    return `${t('voice.greeting')} ${progressLine} ${t('voice.askCommand')}`;
  }, [lastModule, progressModuleTitle, t]);

  const openFirstModule = () => {
    router.push(`/module/${firstModule.id}`);
  };

  const voice = useVoiceAssistant({
    greeting,
    onOpenFirstModule: openFirstModule,
    enabled: isReady && screenFocused,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />

        <VoiceStatusCard
          status={voice.status}
          transcript={voice.transcript}
          recognitionAvailable={voice.recognitionAvailable}
          onRepeat={voice.repeatGreeting}
          onListen={voice.startListening}
        />

        <LanguagePicker />

        <Text style={styles.sectionTitle}>{t('common.module')}</Text>

        {modules.map((module) => {
          const title = t(`${module.translationKey}.title`);
          const description = t(module.descriptionKey);

          return (
            <CardButton
              key={module.id}
              title={title}
              description={description}
              badge={`1 ${t('common.section')}`}
              accessibilityLabel={`${title}. ${description}`}
              accessibilityHint={t('common.openModule')}
              onPress={() => router.push(`/module/${module.id}`)}
            />
          );
        })}
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
});
