import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessibleButton } from '../../components/AccessibleButton';
import { ExerciseIllustration } from '../../components/ExerciseIllustration';
import { LessonVideoPlayer, type LessonVideoPlayerHandle } from '../../components/LessonVideoPlayer';
import { ProgressBar } from '../../components/ProgressBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors, spacing, typography } from '../../constants/theme';
import { getCorrectAnswer, getLesson, lessonHasIntroVideo } from '../../data/content';
import { useContent } from '../../hooks/ContentContext';
import { useVoiceAssistantState } from '../../hooks/VoiceAssistantContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLessonProgress } from '../../hooks/useLessonProgress';
import { spokenExerciseProgress, spokenQuestion } from '../../utils/exerciseSpeech';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  const { isReady } = useContent();
  const { markLessonComplete } = useLessonProgress();
  const { registerExerciseBridge, announceExercise, speakFeedback, status } = useVoiceAssistantState();

  const lesson = getLesson(id);
  const introFinishedRef = useRef(false);
  const videoPlayerRef = useRef<LessonVideoPlayerHandle>(null);

  const [skippedIntro, setSkippedIntro] = useState(false);
  const [userPausedVideo, setUserPausedVideo] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spokenAnswer, setSpokenAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const exercise = lesson?.exercises[currentIndex];
  const correctAnswer = exercise ? getCorrectAnswer(exercise) : 0;

  const questionText = useMemo(() => {
    if (!exercise) {
      return '';
    }

    const questionKeyByType = {
      addition: 'exercise.questionAddition',
      subtraction: 'exercise.questionSubtraction',
      multiplication: 'exercise.questionMultiplication',
      division: 'exercise.questionDivision',
      counting: 'exercise.questionCounting',
    } as const;

    if (exercise.type === 'counting') {
      return t(questionKeyByType.counting);
    }

    return t(questionKeyByType[exercise.type], { a: exercise.a, b: exercise.b });
  }, [exercise, t]);

  const spokenProgressLabel = useMemo(() => {
    if (!lesson) {
      return '';
    }

    return spokenExerciseProgress(
      Math.min(currentIndex + 1, lesson.exercises.length),
      lesson.exercises.length,
      t,
    );
  }, [currentIndex, lesson, t]);

  const spokenQuestionText = useMemo(() => {
    if (!exercise) {
      return '';
    }

    return spokenQuestion(exercise, t);
  }, [exercise, t]);

  const sayAnswerLabel = t('exercise.sayAnswer');
  const correctPraiseLabel = t('exercise.correctPraise');
  const isWatchingIntro = lessonHasIntroVideo(lesson) && !skippedIntro;
  const shouldPauseVideo =
    userPausedVideo ||
    status === 'listening' ||
    status === 'thinking' ||
    status === 'speaking' ||
    status === 'error';

  const startExercises = useCallback(async () => {
    if (introFinishedRef.current || !lesson) {
      return;
    }

    introFinishedRef.current = true;
    setSkippedIntro(true);
    await announceExercise(lesson.id, 0);
  }, [announceExercise, lesson]);

  const resetLessonState = useCallback(() => {
    introFinishedRef.current = false;
    setSkippedIntro(false);
    setUserPausedVideo(false);
    setCurrentIndex(0);
    setSpokenAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setIsFinished(false);
  }, []);

  useEffect(() => {
    introFinishedRef.current = false;
    setSkippedIntro(false);
    setUserPausedVideo(false);
    setCurrentIndex(0);
    setSpokenAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setIsFinished(false);
  }, [id]);

  const finishCorrectAnswer = useCallback(
    async (newCorrectCount: number) => {
      if (!lesson) {
        return;
      }

      await speakFeedback(correctPraiseLabel);

      const totalExercises = lesson.exercises.length;
      const isLastExercise = currentIndex === totalExercises - 1;

      if (isLastExercise) {
        await markLessonComplete(lesson.id, newCorrectCount, totalExercises);
        setIsFinished(true);
        return;
      }

      setCurrentIndex((index) => index + 1);
      setSpokenAnswer(null);
      setShowResult(false);
    },
    [correctPraiseLabel, currentIndex, lesson, markLessonComplete, speakFeedback],
  );

  const submitAnswer = useCallback(
    async (value: number) => {
      if (showResult) {
        return;
      }

      const isCorrect = value === correctAnswer;
      setSpokenAnswer(value);
      setShowResult(true);

      if (!isCorrect) {
        return;
      }

      const newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);
      await finishCorrectAnswer(newCorrectCount);
    },
    [correctAnswer, correctCount, finishCorrectAnswer, showResult],
  );

  const handleFinish = useCallback(() => {
    router.back();
  }, [router]);

  const handleRetry = useCallback(() => {
    if (!lesson) {
      return;
    }

    resetLessonState();
    if (!lessonHasIntroVideo(lesson)) {
      void announceExercise(lesson.id, 0);
    }
  }, [announceExercise, lesson, resetLessonState]);

  useLayoutEffect(() => {
    if (!lesson) {
      registerExerciseBridge(null);
      return;
    }

    if (isFinished) {
      registerExerciseBridge({
        lessonId: lesson.id,
        exerciseIndex: 0,
        correctAnswer: 0,
        showResult: false,
        isFinished: true,
        selectAnswer: async () => {},
        repeatExercise: async () => {},
        retryLesson: async () => {
          handleRetry();
        },
        finishLesson: () => {
          handleFinish();
        },
      });

      return () => registerExerciseBridge(null);
    }

    if (isWatchingIntro) {
      registerExerciseBridge({
        lessonId: lesson.id,
        exerciseIndex: 0,
        correctAnswer: 0,
        showResult: false,
        isFinished: false,
        isWatchingIntro: true,
        skipIntro: startExercises,
        pauseIntro: () => {
          setUserPausedVideo(true);
        },
        resumeIntro: () => {
          setUserPausedVideo(false);
        },
        seekIntroBy: (seconds) => {
          videoPlayerRef.current?.seekBy(seconds);
        },
        selectAnswer: async () => {},
        repeatExercise: async () => {},
      });

      return () => registerExerciseBridge(null);
    }

    if (!exercise) {
      registerExerciseBridge(null);
      return;
    }

    registerExerciseBridge({
      lessonId: lesson.id,
      exerciseIndex: currentIndex,
      correctAnswer,
      showResult,
      isFinished,
      selectAnswer: submitAnswer,
      repeatExercise: async () => {
        await announceExercise(lesson.id, currentIndex);
      },
    });

    return () => registerExerciseBridge(null);
  }, [
    announceExercise,
    correctAnswer,
    currentIndex,
    exercise,
    handleFinish,
    handleRetry,
    isFinished,
    isWatchingIntro,
    lesson,
    registerExerciseBridge,
    showResult,
    startExercises,
    submitAnswer,
  ]);

  useEffect(() => {
    if (!lesson || !isFinished) {
      return;
    }

    void speakFeedback(t('voice.lessonCompletePrompt'));
  }, [isFinished, lesson, speakFeedback, t]);

  useEffect(() => {
    if (!lesson || isFinished || isWatchingIntro || currentIndex === 0) {
      return;
    }

    void announceExercise(lesson.id, currentIndex);
  }, [announceExercise, currentIndex, isFinished, isWatchingIntro, lesson]);

  if (!isReady || !lesson) {
    return null;
  }

  const lessonTitle = lesson.title;
  const totalExercises = lesson.exercises.length;

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

  if (isWatchingIntro && lesson.videoUrl) {
    const skipHint = t('voice.skipVideoHint');

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHeader showBack title={lessonTitle} />

          <LessonVideoPlayer
            ref={videoPlayerRef}
            url={lesson.videoUrl}
            paused={shouldPauseVideo}
            title={lessonTitle}
            rewindLabel={t('common.rewindVideo')}
            forwardLabel={t('common.forwardVideo')}
            onEnded={() => {
              void startExercises();
            }}
          />

          <View style={styles.playbackRow}>
            <AccessibleButton
              label={t('common.stopVideo')}
              onPress={() => setUserPausedVideo(true)}
              variant={userPausedVideo ? 'secondary' : 'primary'}
              style={styles.playbackButton}
            />
            <AccessibleButton
              label={t('common.continue')}
              onPress={() => setUserPausedVideo(false)}
              variant={userPausedVideo ? 'primary' : 'secondary'}
              style={styles.playbackButton}
            />
          </View>

          <Text accessibilityRole="text" accessibilityLabel={skipHint} style={styles.videoHint}>
            {skipHint}
          </Text>

          <AccessibleButton
            label={t('common.skipToExercises')}
            onPress={() => {
              void startExercises();
            }}
            variant="secondary"
            style={styles.actionButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return null;
  }

  const progressLabel = t('exercise.exerciseProgress', {
    current: Math.min(currentIndex + 1, totalExercises),
    total: totalExercises,
  });

  const handleContinue = async () => {
    const isLastExercise = currentIndex === totalExercises - 1;

    if (isLastExercise) {
      await markLessonComplete(lesson.id, correctCount, totalExercises);
      setIsFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSpokenAnswer(null);
    setShowResult(false);
  };

  const feedbackText =
    showResult && spokenAnswer === correctAnswer
      ? correctPraiseLabel
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
          spokenLabel={spokenProgressLabel}
        />

        <View style={styles.questionCard}>
          <Text accessibilityRole="text" accessibilityLabel={sayAnswerLabel} style={styles.questionLabel}>
            {sayAnswerLabel}
          </Text>
          <ExerciseIllustration code={exercise.code} label={spokenQuestionText} />
          <Text
            accessibilityRole="text"
            accessibilityLabel={spokenQuestionText}
            style={styles.question}
          >
            {questionText}
          </Text>
        </View>

        {feedbackText ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.feedback,
              spokenAnswer === correctAnswer ? styles.feedbackSuccess : styles.feedbackError,
            ]}
          >
            {feedbackText}
          </Text>
        ) : null}

        {showResult && spokenAnswer !== correctAnswer ? (
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
  resultCard: {
    backgroundColor: colors.successBg,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.success,
  },
  resultScore: {
    fontSize: typography.body,
    color: colors.text,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
  playbackRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
  },
  playbackButton: {
    flex: 1,
    minHeight: 72,
    marginTop: 0,
  },
  videoHint: {
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  questionLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  question: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 42,
  },
  feedback: {
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  feedbackSuccess: {
    color: colors.success,
  },
  feedbackError: {
    color: colors.error,
  },
});
