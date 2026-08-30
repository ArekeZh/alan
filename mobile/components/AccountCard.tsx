import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AccessibleButton } from './AccessibleButton';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export function AccountCard() {
  const { t } = useLanguage();
  const { user, login, logout } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(nickname.trim());
      setNickname('');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t('auth.loginError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return (
      <View style={styles.card} accessibilityLabel={t('auth.account')}>
        <Text style={styles.label}>{t('auth.loggedInAs')}</Text>
        <Text style={styles.nickname}>{user.nickname}</Text>
        <AccessibleButton label={t('auth.logout')} onPress={() => void logout()} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.card} accessibilityLabel={t('auth.account')}>
      <Text style={styles.label}>{t('auth.prompt')}</Text>
      <Text style={styles.fieldLabel}>{t('auth.nickname')}</Text>
      <TextInput
        value={nickname}
        onChangeText={setNickname}
        placeholder={t('auth.nicknamePlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AccessibleButton
        label={isSubmitting ? t('auth.loggingIn') : t('auth.login')}
        onPress={() => void handleSubmit()}
        disabled={isSubmitting || nickname.trim().length < 2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  nickname: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: typography.body,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
  },
  error: {
    color: colors.error,
    fontSize: typography.caption,
  },
});
