import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

type ProgressBarProps = {
  current: number;
  total: number;
  label: string;
};

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const progress = total === 0 ? 0 : current / total;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: current }}
      accessibilityLabel={label}
      style={styles.container}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});
