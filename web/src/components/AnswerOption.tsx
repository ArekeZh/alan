import type { ReactNode } from 'react';

import { playErrorSound, playSuccessSound } from '../services/feedbackSound';

type AnswerOptionProps = {
  value: number;
  selected: boolean;
  showResult: boolean;
  isCorrect: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function AnswerOption({
  value,
  selected,
  showResult,
  isCorrect,
  disabled,
  onPress,
}: AnswerOptionProps) {
  const handlePress = () => {
    if (disabled) {
      return;
    }

    if (isCorrect) {
      playSuccessSound();
    } else {
      playErrorSound();
    }

    onPress();
  };

  const resultClass =
    showResult && selected
      ? isCorrect
        ? 'answer-option-correct'
        : 'answer-option-wrong'
      : showResult && isCorrect
        ? 'answer-option-correct-outline'
        : '';

  const selectedClass = selected && !showResult ? 'answer-option-selected' : '';

  return (
    <button
      type="button"
      className={`answer-option ${selectedClass} ${resultClass}`.trim()}
      aria-label={String(value)}
      aria-pressed={selected}
      disabled={disabled}
      onClick={handlePress}
    >
      {value}
    </button>
  );
}

export function AnswerGrid({ children }: { children: ReactNode }) {
  return <div className="answer-grid">{children}</div>;
}
