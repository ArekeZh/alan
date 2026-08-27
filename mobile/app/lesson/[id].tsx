import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessibleButton } from '../../components/AccessibleButton';
import { AnswerGrid, AnswerOption } from '../../components/AnswerOption';
import { ProgressBar } from '../../components/ProgressBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography } from '../../constants/theme';
import { getCorrectAnswer, getLesson } from '../../data/content';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLessonProgress } from '../../hooks/useLessonProgress';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { markLessonComplete } = useLessonProgress();

  const lesson = getLesson(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const exercise = lesson?.exercises[currentIndex];
  const correctAnswer = exercise ? getCorrectAnswer(exercise) : 0;

  const questionText = useMemo(() => {
    if (!exercise) {
      return '';
    }

    const key =
      exercise.type === 'addition'
        ? 'exercise.questionAddition'
        : 'exercise.questionSubtraction';

    return t(key, { a: exercise.a, b: exercise.b });
  }, [exercise, t]);

  if (!lesson || !exercise) {
    return null;
  }

  const lessonTitle = t(`${lesson.translationKey}.title`);
  const totalExercises = lesson.exercises.length;
  const progressLabel = t('exercise.exerciseProgress', {
    current: Math.min(currentIndex + 1, totalExercises),
    total: totalExercises,
  });

  const handleSelectAnswer = (value: number) => {
    if (showResult) {
      return;
    }

    setSelectedAnswer(value);
    setShowResult(true);

    if (value === correctAnswer) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleContinue = async () => {
    const isLastExercise = currentIndex === totalExercises - 1;

    if (isLastExercise) {
      await markLessonComplete(lesson.id, correctCount, totalExercises);
      setIsFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleFinish = () => {
    router.back();
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.finishContainer}>
          <ScreenHeader showBack title={lessonTitle} />

          <View style={styles.resultCard}>
            <Text accessibilityRole="header" style={styles.resultTitle}>
              {t('common.lessonComplete')}
            </Text>
            <Text style={styles.resultScore}>
              {t('common.score')}: {correctCount} {t('common.of')} {totalExercises}
            </Text>
          </View>

          <AccessibleButton
            label={t('common.tryAgain')}
            onPress={handleRetry}
            variant="secondary"
            style={styles.actionButton}
          />
          <AccessibleButton
            label={t('common.finish')}
            onPress={handleFinish}
            style={styles.actionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const feedbackText =
    showResult && selectedAnswer === correctAnswer
      ? t('common.correct')
      : showResult
        ? `${t('common.wrong')} ${correctAnswer}`
        : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader showBack title={lessonTitle} />

        <ProgressBar
          current={currentIndex + (showResult ? 1 : 0)}
          total={totalExercises}
          label={progressLabel}
        />

        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>{t('exercise.chooseAnswer')}</Text>
          <Text
            accessibilityRole="text"
            accessibilityLabel={questionText}
            style={styles.question}
          >
            {questionText}
          </Text>
        </View>

        <AnswerGrid>
          {exercise.options.map((option) => (
            <AnswerOption
              key={option}
              value={option}
              selected={selectedAnswer === option}
              showResult={showResult}
              isCorrect={option === correctAnswer}
              disabled={showResult}
              onPress={() => handleSelectAnswer(option)}
            />
          ))}
        </AnswerGrid>

        {feedbackText ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.feedback,
              selectedAnswer === correctAnswer ? styles.feedbackSuccess : styles.feedbackError,
            ]}
          >
            {feedbackText}
          </Text>
        ) : null}

        {showResult ? (
          <AccessibleButton
            label={
              currentIndex === totalExercises - 1
                ? t('common.finish')
                : t('common.continue')
            }
            onPress={handleContinue}
            style={styles.actionButton}
          />
        ) : null}
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
  finishContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  questionLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  question: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  feedback: {
    marginTop: spacing.md,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  feedbackSuccess: {
    color: colors.success,
  },
  feedbackError: {
    color: colors.error,
  },
  actionButton: {
    marginTop: spacing.lg,
  },
  resultCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.success,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.success,
    textAlign: 'center',
  },
  resultScore: {
    fontSize: typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
});
