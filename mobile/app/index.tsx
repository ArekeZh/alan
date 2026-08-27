import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardButton } from '../components/CardButton';
import { LanguagePicker } from '../components/LanguagePicker';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, spacing, typography } from '../constants/theme';
import { modules } from '../data/content';
import { useLanguage } from '../i18n/LanguageContext';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('app.name')} subtitle={t('app.tagline')} />

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
