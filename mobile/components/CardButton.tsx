import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, touchTarget, typography } from '../constants/theme';
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        void interruptSpeechForNavigation();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: touchTarget.minHeight + 24,
    marginBottom: spacing.sm,
  },
  pressed: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textBlock: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  badge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
