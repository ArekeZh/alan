import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { AccessibleButton } from '../components/AccessibleButton';
import { ExerciseIllustration } from '../components/ExerciseIllustration';
import { LessonVideoPlayer, type LessonVideoPlayerHandle } from '../components/LessonVideoPlayer';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCorrectAnswer, getLesson, lessonHasIntroVideo } from '../data/content';
import { useContent } from '../hooks/ContentContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useVoiceAssistantState } from '../hooks/VoiceAssistantContext';
import { useLanguage } from '../i18n/LanguageContext';
import { playSuccessSound } from '../services/feedbackSound';
import { spokenExerciseProgress, spokenQuestion } from '../utils/exerciseSpeech';

export function LessonPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        playSuccessSound();
        setIsFinished(true);
        return;
      }

      setCurrentIndex((index) => index + 1);
      setSpokenAnswer(null);
      setShowResult(false);
    },
    [
      correctPraiseLabel,
      currentIndex,
      lesson,
      markLessonComplete,
      speakFeedback,
    ],
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
    void navigate(-1);
  }, [navigate]);

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
      <main className="screen screen-finish">
        <ScreenHeader showBack title={lessonTitle} />

        <section className="result-card">
          <h2 className="result-title">{t('common.lessonComplete')}</h2>
          <p className="result-score">
            {t('common.score')}: {correctCount} {t('common.of')} {totalExercises}
          </p>
        </section>

        <AccessibleButton
          label={t('common.tryAgain')}
          onPress={handleRetry}
          variant="secondary"
        />
        <AccessibleButton label={t('common.finish')} onPress={handleFinish} />
      </main>
    );
  }

  if (isWatchingIntro && lesson.videoUrl) {
    const skipHint = t('voice.skipVideoHint');

    return (
      <main className="screen">
        <ScreenHeader showBack title={lessonTitle} />

        <LessonVideoPlayer
          ref={videoPlayerRef}
          url={lesson.videoUrl}
          paused={shouldPauseVideo}
          title={lessonTitle}
          playLabel={t('common.playVideo')}
          rewindLabel={t('common.rewindVideo')}
          forwardLabel={t('common.forwardVideo')}
          onEnded={() => {
            void startExercises();
          }}
        />

        <div className="lesson-video-controls">
          <AccessibleButton
            label={t('common.stopVideo')}
            onPress={() => setUserPausedVideo(true)}
            variant={userPausedVideo ? 'secondary' : 'primary'}
          />
          <AccessibleButton
            label={t('common.continue')}
            onPress={() => setUserPausedVideo(false)}
            variant={userPausedVideo ? 'primary' : 'secondary'}
          />
        </div>

        <p className="lesson-video-hint" data-hover-speak aria-label={skipHint}>
          {skipHint}
        </p>

        <AccessibleButton
          label={t('common.skipToExercises')}
          onPress={() => {
            void startExercises();
          }}
          variant="secondary"
        />
      </main>
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
      playSuccessSound();
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
    <main className="screen">
      <ScreenHeader showBack title={lessonTitle} />

      <ProgressBar
        current={currentIndex + (showResult ? 1 : 0)}
        total={totalExercises}
        label={progressLabel}
        spokenLabel={spokenProgressLabel}
      />

      <section className="question-card">
        <p className="section-label" data-hover-speak aria-label={sayAnswerLabel}>
          {sayAnswerLabel}
        </p>
        <ExerciseIllustration code={exercise.code} label={spokenQuestionText} />
        <p className="question" data-hover-speak aria-label={spokenQuestionText}>
          {questionText}
        </p>
      </section>

      {feedbackText ? (
        <p className="feedback" aria-live="polite">
          {feedbackText}
        </p>
      ) : null}

      {showResult && spokenAnswer !== correctAnswer ? (
        <AccessibleButton
          label={
            currentIndex === totalExercises - 1 ? t('common.finish') : t('common.continue')
          }
          onPress={() => void handleContinue()}
        />
      ) : null}
    </main>
  );
}
