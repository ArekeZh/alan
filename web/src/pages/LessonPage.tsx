import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { AccessibleButton } from '../components/AccessibleButton';
import { AnswerGrid, AnswerOption } from '../components/AnswerOption';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCorrectAnswer, getLesson } from '../data/content';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useVoiceAssistantState } from '../hooks/VoiceAssistantContext';
import { useLanguage } from '../i18n/LanguageContext';
import { playSuccessSound } from '../services/feedbackSound';
import {
  spokenAnswerOption,
  spokenExerciseProgress,
  spokenQuestion,
} from '../utils/exerciseSpeech';

export function LessonPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { markLessonComplete } = useLessonProgress();
  const { registerExerciseBridge, announceExercise, speakFeedback } = useVoiceAssistantState();

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

    const questionKeyByType = {
      addition: 'exercise.questionAddition',
      subtraction: 'exercise.questionSubtraction',
      multiplication: 'exercise.questionMultiplication',
      division: 'exercise.questionDivision',
    } as const;

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

  const chooseAnswerLabel = t('exercise.chooseAnswer');
  const correctPraiseLabel = t('exercise.correctPraise');

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
      setSelectedAnswer(null);
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
      setSelectedAnswer(value);
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

    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setIsFinished(false);
    void announceExercise(lesson.id, 0);
  }, [announceExercise, lesson]);

  useLayoutEffect(() => {
    if (!lesson) {
      registerExerciseBridge(null);
      return;
    }

    if (isFinished) {
      registerExerciseBridge({
        lessonId: lesson.id,
        exerciseIndex: 0,
        options: [],
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

    if (!exercise) {
      registerExerciseBridge(null);
      return;
    }

    registerExerciseBridge({
      lessonId: lesson.id,
      exerciseIndex: currentIndex,
      options: exercise.options,
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
    lesson,
    registerExerciseBridge,
    showResult,
    submitAnswer,
  ]);

  useEffect(() => {
    if (!lesson || !isFinished) {
      return;
    }

    void speakFeedback(t('voice.lessonCompletePrompt'));
  }, [isFinished, lesson, speakFeedback, t]);

  useEffect(() => {
    if (!lesson || isFinished || currentIndex === 0) {
      return;
    }

    void announceExercise(lesson.id, currentIndex);
  }, [announceExercise, currentIndex, isFinished, lesson]);

  if (!lesson) {
    return null;
  }

  const lessonTitle = t(`${lesson.translationKey}.title`);
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
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const feedbackText =
    showResult && selectedAnswer === correctAnswer
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
        <p className="section-label" data-hover-speak aria-label={chooseAnswerLabel}>
          {chooseAnswerLabel}
        </p>
        <p className="question" data-hover-speak aria-label={spokenQuestionText}>
          {questionText}
        </p>
      </section>

      <AnswerGrid>
        {exercise.options.map((option) => (
          <AnswerOption
            key={option}
            value={option}
            spokenLabel={spokenAnswerOption(option, t)}
            selected={selectedAnswer === option}
            showResult={showResult}
            isCorrect={option === correctAnswer}
            disabled={showResult}
            onPress={() => void submitAnswer(option)}
          />
        ))}
      </AnswerGrid>

      {feedbackText ? (
        <p className="feedback" aria-live="polite">
          {feedbackText}
        </p>
      ) : null}

      {showResult && selectedAnswer !== correctAnswer ? (
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
