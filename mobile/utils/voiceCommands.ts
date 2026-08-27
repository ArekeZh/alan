import { Language } from '../types';

export function normalizeSpeech(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:"'«»()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MODULE_WORDS = ['модуль', 'модул', 'modul', 'module'];

const BACK_WORDS = new Set([
  'арт',
  'артка',
  'артқа',
  'арткы',
  'art',
  'arta',
  'artka',
  'artqa',
  'artga',
  'назад',
  'nazad',
  'back',
]);

const BACK_PREFIXES = ['артк', 'артқ', 'artk', 'artq', 'artg'];

export function wantsOpenFirstModule(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const compact = text.replace(/\s/g, '');
  return MODULE_WORDS.some((word) => text.includes(word) || compact.includes(word));
}

const LANGUAGE_COMMAND_WORDS = [
  'тіл',
  'тил',
  'til',
  'teel',
  'language',
  'langwij',
  'язык',
  'язик',
  'yazyk',
];

const LANGUAGE_NAMES: { language: Language; names: string[] }[] = [
  {
    language: 'kk',
    names: [
      'қазақша',
      'қазақ',
      'казакша',
      'казахша',
      'казахский',
      'казах',
      'kazakh',
      'kazaksha',
      'kazak',
      'qazaq',
    ],
  },
  {
    language: 'ru',
    names: [
      'орысша',
      'орыс',
      'русский',
      'русски',
      'русск',
      'russian',
      'russkiy',
      'orys',
      'orissha',
    ],
  },
  {
    language: 'en',
    names: [
      'ағылшынша',
      'ағылшын',
      'агылшынша',
      'агылшын',
      'английский',
      'английск',
      'english',
      'inglish',
      'agylshyn',
    ],
  },
];

export function wantsChangeLanguage(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return LANGUAGE_COMMAND_WORDS.some((word) => {
    const isShortWord = word.length <= 3;
    if (isShortWord) {
      return tokens.includes(word);
    }

    return tokens.includes(word) || compact.includes(word);
  });
}

export function parseSpokenLanguage(transcript: string): Language | null {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return null;
  }

  const compact = text.replace(/\s/g, '');
  let bestMatch: { language: Language; length: number } | null = null;

  for (const option of LANGUAGE_NAMES) {
    for (const name of option.names) {
      const normalizedName = normalizeSpeech(name);
      const compactName = normalizedName.replace(/\s/g, '');
      const isMatch = text.includes(normalizedName) || compact.includes(compactName);
      if (!isMatch) {
        continue;
      }

      const isLonger = !bestMatch || compactName.length > bestMatch.length;
      if (isLonger) {
        bestMatch = { language: option.language, length: compactName.length };
      }
    }
  }

  return bestMatch?.language ?? null;
}

export function wantsGoBack(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const nextToken = tokens[index + 1];

    if (BACK_WORDS.has(token)) {
      return true;
    }

    if (BACK_PREFIXES.some((prefix) => token.startsWith(prefix) && token.length <= 8)) {
      return true;
    }

    const isSplitBack =
      token === 'арт' &&
      (nextToken === 'ка' || nextToken === 'қа' || nextToken === 'ka' || nextToken === 'qa');
    if (isSplitBack) {
      return true;
    }
  }

  return false;
}
