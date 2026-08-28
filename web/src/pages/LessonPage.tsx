import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { AccessibleButton } from '../components/AccessibleButton';
import { AnswerGrid, AnswerOption } from '../components/AnswerOption';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCorrectAnswer, getLesson } from '../data/content';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { useLanguage } from '../i18n/LanguageContext';
import { playSuccessSound } from '../services/feedbackSound';

export function LessonPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

    const questionKeyByType = {
      addition: 'exercise.questionAddition',
      subtraction: 'exercise.questionSubtraction',
      multiplication: 'exercise.questionMultiplication',
      division: 'exercise.questionDivision',
    } as const;

    return t(questionKeyByType[exercise.type], { a: exercise.a, b: exercise.b });
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
      playSuccessSound();
      setIsFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleFinish = () => {
    void navigate(-1);
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

  const feedbackText =
    showResult && selectedAnswer === correctAnswer
      ? t('common.correct')
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
      />

      <section className="question-card">
        <p className="section-label">{t('exercise.chooseAnswer')}</p>
        <p className="question" aria-label={questionText}>
          {questionText}
        </p>
      </section>

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
        <p className="feedback" aria-live="polite">
          {feedbackText}
        </p>
      ) : null}

      {showResult ? (
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
