import { type FormEvent, useState } from 'react';

import { useAuth } from '../hooks/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export function AccountCard() {
  const { t } = useLanguage();
  const { user, login, logout } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
      <section className="account-card" aria-label={t('auth.account')}>
        <p className="account-label" data-hover-speak aria-label={t('auth.loggedInAs')}>
          {t('auth.loggedInAs')}
        </p>
        <p className="account-nickname" data-hover-speak aria-label={user.nickname}>
          {user.nickname}
        </p>
        <button type="button" className="account-button secondary" onClick={logout}>
          {t('auth.logout')}
        </button>
      </section>
    );
  }

  return (
    <section className="account-card" aria-label={t('auth.account')}>
      <p className="account-label" data-hover-speak aria-label={t('auth.prompt')}>
        {t('auth.prompt')}
      </p>
      <form className="account-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="account-field">
          <span data-hover-speak aria-label={t('auth.nickname')}>
            {t('auth.nickname')}
          </span>
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder={t('auth.nicknamePlaceholder')}
            autoComplete="nickname"
            minLength={2}
            maxLength={50}
            required
          />
        </label>
        {error ? <p className="account-error">{error}</p> : null}
        <button type="submit" className="account-button" disabled={isSubmitting}>
          {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
        </button>
      </form>
    </section>
  );
}
