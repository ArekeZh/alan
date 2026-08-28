type AccessibleButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
};

export function AccessibleButton({
  label,
  onPress,
  accessibilityHint,
  variant = 'primary',
  disabled = false,
  className,
}: AccessibleButtonProps) {
  const classes = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      title={accessibilityHint}
      disabled={disabled}
      onClick={onPress}
    >
      {label}
    </button>
  );
}
