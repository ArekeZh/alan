import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardButton } from '../../components/CardButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography } from '../../constants/theme';
import { getModule, getSectionsForModule } from '../../data/content';
import { useLessonProgress } from '../../hooks/useLessonProgress';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { setLastOpenedModule } = useLessonProgress();

  const module = getModule(id);
  const moduleSections = getSectionsForModule(id);

  useEffect(() => {
    if (id) {
      setLastOpenedModule(id);
    }
  }, [id, setLastOpenedModule]);

  if (!module) {
    return null;
  }

  const moduleTitle = t(`${module.translationKey}.title`);
  const moduleDescription = t(module.descriptionKey);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          showBack
          title={moduleTitle}
          subtitle={moduleDescription}
        />

        <Text style={styles.sectionTitle}>{t('common.section')}</Text>

        {moduleSections.map((section) => {
          const title = t(`${section.translationKey}.title`);
          const description = t(section.descriptionKey);

          return (
            <CardButton
              key={section.id}
              title={title}
              description={description}
              badge={`${section.lessonIds.length} ${t('common.lesson')}`}
              accessibilityLabel={`${title}. ${description}`}
              accessibilityHint={t('common.openSection')}
              onPress={() => router.push(`/section/${section.id}`)}
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
