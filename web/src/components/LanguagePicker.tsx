import { languageOptions } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';

export function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-picker" role="radiogroup" aria-label={t('common.language')}>
      <p className="section-label">{t('common.language')}</p>
      <div className="language-options">
        {languageOptions.map((option) => (
          <LanguageOption
            key={option}
            selected={language === option}
            title={t(`languages.${option}`)}
            onSelect={() => setLanguage(option)}
          />
        ))}
      </div>
    </div>
  );
}

function LanguageOption({
  selected,
  title,
  onSelect,
}: {
  selected: boolean;
  title: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={title}
      className={selected ? 'chip chip-selected' : 'chip'}
      onClick={onSelect}
    >
      {title}
    </button>
  );
}
