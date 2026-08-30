import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardButton } from '../../components/CardButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography } from '../../constants/theme';
import { getLessonsForSection, getSection } from '../../data/content';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLessonProgress } from '../../hooks/useLessonProgress';

export default function SectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { getLessonStatus } = useLessonProgress();

  const section = getSection(id);
  const sectionLessons = getLessonsForSection(id);

  if (!section) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader showBack title={section.title} subtitle={section.description} />

        <Text style={styles.sectionTitle}>{t('common.lesson')}</Text>

        {sectionLessons.map((lesson, index) => {
          const status = getLessonStatus(lesson.id);

          const badge = status?.completed
            ? t('common.completed')
            : status
              ? `${status.score}/${lesson.exercises.length}`
              : t('common.notStarted');

          return (
            <CardButton
              key={lesson.id}
              title={`${index + 1}. ${lesson.title}`}
              description={lesson.description}
              badge={badge}
              accessibilityLabel={`${t('common.lesson')} ${index + 1}. ${lesson.title}. ${lesson.description}. ${badge}`}
              accessibilityHint={t('common.openLesson')}
              onPress={() => router.push(`/lesson/${lesson.id}`)}
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
