import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, touchTarget, typography } from '../constants/theme';

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    onPress();
  };

  const resultStyle =
    showResult && selected
      ? isCorrect
        ? styles.correct
        : styles.wrong
      : showResult && isCorrect
        ? styles.correctOutline
        : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={String(value)}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.option,
        selected && !showResult && styles.selected,
        resultStyle,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.value}>{value}</Text>
    </Pressable>
  );
}

export function AnswerGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  option: {
    minHeight: touchTarget.minHeight,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  correct: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  wrong: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  correctOutline: {
    borderColor: colors.success,
  },
  pressed: {
    opacity: 0.9,
  },
  value: {
    fontSize: typography.heading,
    fontWeight: '800',
    color: colors.text,
  },
});
