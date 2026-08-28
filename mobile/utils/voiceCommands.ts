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

const INFORMATION_WORDS = [
  'ақпарат',
  'акпарат',
  'ақпаратты',
  'информация',
  'информаци',
  'информацию',
  'информации',
  'information',
  'info',
  'мәлімет',
  'малимет',
];

export function wantsInformation(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return INFORMATION_WORDS.some((word) => {
    const normalized = normalizeSpeech(word);
    if (normalized.length <= 4) {
      return tokens.includes(normalized);
    }

    return tokens.includes(normalized) || compact.includes(normalized);
  });
}

export type SpokenSectionOption = {
  id: string;
  names: string[];
};

const SECTION_WORDS = [
  'бөлім',
  'болиім',
  'болим',
  'bolim',
  'раздел',
  'раздела',
  'разделу',
  'section',
];

const NUMBER_WORDS: { number: number; words: string[] }[] = [
  {
    number: 1,
    words: [
      '1',
      'бір',
      'бир',
      'бірінші',
      'биринши',
      'birinshi',
      'один',
      'одна',
      'одно',
      'первый',
      'первая',
      'первое',
      'первого',
      'первий',
      'first',
      'one',
    ],
  },
  {
    number: 2,
    words: [
      '2',
      'екі',
      'еки',
      'екінші',
      'екинши',
      'ekinshi',
      'два',
      'две',
      'второй',
      'вторая',
      'второе',
      'второго',
      'second',
      'two',
    ],
  },
  {
    number: 3,
    words: [
      '3',
      'үш',
      'уш',
      'үшінші',
      'ушинши',
      'ushinshi',
      'три',
      'третий',
      'третья',
      'третье',
      'третьего',
      'third',
      'three',
    ],
  },
  {
    number: 4,
    words: [
      '4',
      'төрт',
      'торт',
      'төртінші',
      'тортинши',
      'четыре',
      'четвёртый',
      'четвертый',
      'четвертая',
      'fourth',
      'four',
    ],
  },
  {
    number: 5,
    words: [
      '5',
      'бес',
      'бесінші',
      'бесинши',
      'пять',
      'пятый',
      'пятая',
      'fifth',
      'five',
    ],
  },
  {
    number: 6,
    words: ['6', 'алты', 'алтыншы', 'шесть', 'шестой', 'шестая', 'sixth', 'six'],
  },
  {
    number: 7,
    words: ['7', 'жеті', 'жети', 'жетінші', 'семь', 'седьмой', 'седьмая', 'seventh', 'seven'],
  },
  {
    number: 8,
    words: [
      '8',
      'сегіз',
      'сегиз',
      'сегізінші',
      'восемь',
      'восьмой',
      'восьмая',
      'eighth',
      'eight',
    ],
  },
  {
    number: 9,
    words: [
      '9',
      'тоғыз',
      'тогыз',
      'тоғызыншы',
      'девять',
      'девятый',
      'девятая',
      'ninth',
      'nine',
    ],
  },
  {
    number: 10,
    words: ['10', 'он', 'оныншы', 'десять', 'десятый', 'десятая', 'tenth', 'ten'],
  },
];

function hasSectionWord(text: string) {
  const tokens = text.split(' ');
  const compact = tokens.join('');

  return SECTION_WORDS.some((word) => {
    const normalized = normalizeSpeech(word);
    return tokens.includes(normalized) || compact.includes(normalized);
  });
}

function parseSpokenNumber(text: string) {
  const tokens = text.split(' ');
  const compact = tokens.join('');
  let bestMatch: { number: number; length: number } | null = null;

  for (const option of NUMBER_WORDS) {
    for (const word of option.words) {
      const normalized = normalizeSpeech(word);
      const isDigit = /^\d+$/.test(normalized);
      const isShortWord = normalized.length <= 3;
      const isExactToken = tokens.includes(normalized);
      const isMatch =
        isDigit || isShortWord ? isExactToken : isExactToken || compact.includes(normalized);

      if (!isMatch) {
        continue;
      }

      const isLonger = !bestMatch || normalized.length > bestMatch.length;
      if (isLonger) {
        bestMatch = { number: option.number, length: normalized.length };
      }
    }
  }

  return bestMatch?.number ?? null;
}

export type SectionCommandResult =
  | { kind: 'match'; id: string }
  | { kind: 'unknown' }
  | { kind: 'none' };

export function interpretSectionCommand(
  transcript: string,
  sections: SpokenSectionOption[],
): SectionCommandResult {
  const text = normalizeSpeech(transcript);
  if (!text || sections.length === 0) {
    return { kind: 'none' };
  }

  let bestName: { id: string; length: number } | null = null;

  for (const section of sections) {
    for (const name of section.names) {
      const normalizedName = normalizeSpeech(name);
      if (normalizedName.length < 3) {
        continue;
      }

      const isMatch = text.includes(normalizedName);
      if (!isMatch) {
        continue;
      }

      const isLonger = !bestName || normalizedName.length > bestName.length;
      if (isLonger) {
        bestName = { id: section.id, length: normalizedName.length };
      }
    }
  }

  if (bestName) {
    return { kind: 'match', id: bestName.id };
  }

  const spokenNumber = parseSpokenNumber(text);
  if (spokenNumber !== null) {
    const section = sections[spokenNumber - 1];
    if (section) {
      return { kind: 'match', id: section.id };
    }

    return { kind: 'unknown' };
  }

  if (hasSectionWord(text)) {
    return { kind: 'unknown' };
  }

  return { kind: 'none' };
}
