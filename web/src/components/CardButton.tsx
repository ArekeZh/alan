import { interruptSpeechForNavigation } from '../utils/navigationSpeech';

type CardButtonProps = {
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
};

export function CardButton({
  title,
  description,
  badge,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: CardButtonProps) {
  return (
    <button
      type="button"
      className="card-button"
      data-hover-speak
      aria-label={accessibilityLabel}
      title={accessibilityHint}
      onClick={() => {
        interruptSpeechForNavigation();
        onPress();
      }}
    >
      <span className="card-button-text">
        <span className="card-button-title">{title}</span>
        <span className="card-button-description">{description}</span>
      </span>
      {badge ? <span className="badge">{badge}</span> : null}
    </button>
  );
}
