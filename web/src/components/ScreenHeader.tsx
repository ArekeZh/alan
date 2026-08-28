import { useNavigate } from 'react-router';

import { useLanguage } from '../i18n/LanguageContext';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, showBack = false }: ScreenHeaderProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="screen-header">
      {showBack ? (
        <button
          type="button"
          className="back-button"
          aria-label={t('common.back')}
          onClick={() => void navigate(-1)}
        >
          ← {t('common.back')}
        </button>
      ) : null}
      <h1 className="screen-title">{title}</h1>
      {subtitle ? <p className="screen-subtitle">{subtitle}</p> : null}
    </header>
  );
}
