type ExerciseIllustrationProps = {
  code: string | null;
  label: string;
};

export function ExerciseIllustration({ code, label }: ExerciseIllustrationProps) {
  if (!code) {
    return null;
  }

  return (
    <div
      className="exercise-illustration"
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
