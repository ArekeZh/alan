import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, touchTarget, typography } from '../constants/theme';
import { Language } from '../types';
import { languageOptions } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';

export function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('common.language')}
      style={styles.container}
    >
      <Text style={styles.label}>{t('common.language')}</Text>
      <View style={styles.options}>
        {languageOptions.map((option) => (
          <LanguageOption
            key={option}
            option={option}
            selected={language === option}
            title={t(`languages.${option}`)}
            onSelect={() => setLanguage(option)}
          />
        ))}
      </View>
    </View>
  );
}

function LanguageOption({
  option,
  selected,
  title,
  onSelect,
}: {
  option: Language;
  selected: boolean;
  title: string;
  onSelect: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={onSelect}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  option: {
    minHeight: touchTarget.minHeight - 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#DBEAFE',
  },
  optionText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primaryDark,
  },
});
