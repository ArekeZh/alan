import type { Language } from '../types';

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

const LANGUAGE_CHANGE_PHRASES = [
  'change language',
  'switch language',
  'change the language',
  'switch the language',
  'change lang',
  'switch lang',
  'language change',
  'set language',
  'поменять язык',
  'сменить язык',
  'поменяй язык',
  'смени язык',
  'изменить язык',
  'измени язык',
  'тілді ауыстыр',
  'тіл ауыстыр',
  'тилди ауыстыр',
  'тил ауыстыр',
  'tildi austyr',
  'til austyr',
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
      'казахском',
      'казахского',
      'казахской',
      'казах',
      'kazakh',
      'kazaksha',
      'kazak',
      'kazah',
      'kazach',
      'kazakhstan',
      'qazaq',
      'qazaqsha',
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

function matchesLanguageName(text: string, name: string) {
  const normalizedName = normalizeSpeech(name);
  if (!normalizedName) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = text.replace(/\s/g, '');
  const compactName = normalizedName.replace(/\s/g, '');

  if (text.includes(normalizedName) || compact.includes(compactName)) {
    return true;
  }

  if (tokens.includes(normalizedName)) {
    return true;
  }

  if (normalizedName.length < 4) {
    return false;
  }

  const stemLength = Math.max(4, normalizedName.length - 2);
  const stem = normalizedName.slice(0, stemLength);
  return tokens.some((token) => token.startsWith(stem) && token.length >= stem.length);
}

export function wantsChangeLanguage(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const hasPhrase = LANGUAGE_CHANGE_PHRASES.some((phrase) => text.includes(normalizeSpeech(phrase)));
  if (hasPhrase) {
    return true;
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

  let bestMatch: { language: Language; length: number } | null = null;

  for (const option of LANGUAGE_NAMES) {
    for (const name of option.names) {
      const normalizedName = normalizeSpeech(name);
      if (!matchesLanguageName(text, name)) {
        continue;
      }

      const nameLength = normalizedName.replace(/\s/g, '').length;
      const isLonger = !bestMatch || nameLength > bestMatch.length;
      if (isLonger) {
        bestMatch = { language: option.language, length: nameLength };
      }
    }
  }

  return bestMatch?.language ?? null;
}

const LANGUAGE_PROMPT_ECHO_PHRASES = [
  'which language',
  'what language',
  'should i switch',
  'switch to',
  'қандай тіл',
  'на какой язык',
  'переключить',
  'say kazakh',
  'say russian',
  'say english',
];

const LANGUAGE_PICK_NOISE_WORDS = [
  'which',
  'what',
  'language',
  'should',
  'switch',
  'please',
  'say',
  'the',
  'to',
  'a',
  'i',
];

export function looksLikeLanguagePromptEcho(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  return LANGUAGE_PROMPT_ECHO_PHRASES.some((phrase) => text.includes(normalizeSpeech(phrase)));
}

export function stripLanguagePickNoise(transcript: string) {
  let text = normalizeSpeech(transcript);
  if (!text) {
    return '';
  }

  for (const phrase of LANGUAGE_PROMPT_ECHO_PHRASES) {
    text = text.replaceAll(normalizeSpeech(phrase), ' ');
  }

  const tokens = text
    .split(' ')
    .filter((token) => token && !LANGUAGE_PICK_NOISE_WORDS.includes(token));

  return tokens.join(' ').trim();
}

export function parseLanguagePickAnswer(transcript: string): Language | null {
  const direct = parseSpokenLanguage(transcript);
  if (direct) {
    return direct;
  }

  const cleaned = stripLanguagePickNoise(transcript);
  if (!cleaned) {
    return null;
  }

  return parseSpokenLanguage(cleaned);
}

export function isBareLanguageName(transcript: string) {
  if (wantsChangeLanguage(transcript)) {
    return false;
  }

  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  if (tokens.length > 4) {
    return false;
  }

  return parseLanguagePickAnswer(transcript) !== null;
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

const REPEAT_WORDS = [
  'повтори',
  'повторить',
  'повтор',
  'қайтала',
  'qaytala',
  'qaitala',
  'repeat',
  'again',
];

export function wantsRepeat(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return REPEAT_WORDS.some((word) => {
    const normalized = normalizeSpeech(word);
    if (normalized.length <= 5) {
      return tokens.includes(normalized);
    }

    return tokens.includes(normalized) || compact.includes(normalized);
  });
}

const RETRY_LESSON_WORDS = [
  'try again',
  'попробовать снова',
  'попробовать',
  'қайта байқау',
  'қайта байқап көр',
  'qayta baqau',
];

export function wantsRetryLesson(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return RETRY_LESSON_WORDS.some((word) => {
    const normalized = normalizeSpeech(word);
    const normalizedCompact = normalized.replace(/\s/g, '');

    if (normalized.length <= 4) {
      return tokens.includes(normalized);
    }

    return (
      tokens.includes(normalized) ||
      compact.includes(normalizedCompact) ||
      text.includes(normalized)
    );
  });
}

const RETURN_TO_LESSONS_WORDS = [
  'finish',
  'завершить',
  'аяқтау',
  'ayaktau',
  'return',
  'вернуться',
  'вернутся',
];

export function wantsReturnToLessons(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return RETURN_TO_LESSONS_WORDS.some((word) => {
    const normalized = normalizeSpeech(word);
    if (normalized.length <= 5) {
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
      'одного',
      'одному',
      'одним',
      'первый',
      'первая',
      'первое',
      'первого',
      'первий',
      'first',
      'one',
      'won',
      'wan',
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
      'двух',
      'двум',
      'двумя',
      'второй',
      'вторая',
      'второе',
      'второго',
      'second',
      'two',
      'to',
      'too',
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
      'трех',
      'трем',
      'тремя',
      'третий',
      'третья',
      'третье',
      'третьего',
      'third',
      'three',
      'tree',
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
      'четырех',
      'четырем',
      'четвертый',
      'четвертая',
      'fourth',
      'four',
      'for',
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
      'пяти',
      'пятью',
      'пятый',
      'пятая',
      'fifth',
      'five',
    ],
  },
  {
    number: 6,
    words: ['6', 'алты', 'алтыншы', 'шесть', 'шести', 'шестой', 'шестая', 'sixth', 'six'],
  },
  {
    number: 7,
    words: ['7', 'жеті', 'жети', 'жетінші', 'семь', 'семи', 'седьмой', 'седьмая', 'seventh', 'seven'],
  },
  {
    number: 8,
    words: [
      '8',
      'сегіз',
      'сегиз',
      'сегізінші',
      'восемь',
      'восеми',
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
      'девяти',
      'девятый',
      'девятая',
      'ninth',
      'nine',
    ],
  },
  {
    number: 10,
    words: ['10', 'он', 'оныншы', 'десять', 'десяти', 'десятый', 'десятая', 'tenth', 'ten'],
  },
  {
    number: 11,
    words: ['11', 'он бір', 'он бир', 'одиннадцать', 'eleven'],
  },
  {
    number: 12,
    words: ['12', 'он екі', 'он еки', 'двенадцать', 'twelve'],
  },
  {
    number: 13,
    words: ['13', 'он үш', 'он уш', 'тринадцать', 'thirteen'],
  },
  {
    number: 14,
    words: ['14', 'он төрт', 'он торт', 'четырнадцать', 'fourteen'],
  },
  {
    number: 15,
    words: ['15', 'он бес', 'пятнадцать', 'fifteen'],
  },
  {
    number: 16,
    words: ['16', 'он алты', 'шестнадцать', 'sixteen'],
  },
  {
    number: 17,
    words: ['17', 'он жеті', 'он жети', 'семнадцать', 'seventeen'],
  },
  {
    number: 18,
    words: ['18', 'он сегіз', 'он сегиз', 'восемнадцать', 'eighteen'],
  },
  {
    number: 19,
    words: ['19', 'он тоғыз', 'он тогыз', 'девятнадцать', 'nineteen'],
  },
  {
    number: 20,
    words: ['20', 'жиырма', 'жирма', 'двадцать', 'twenty'],
  },
];

const LESSON_WORDS = [
  'сабақ',
  'сабак',
  'sabaq',
  'sabaқ',
  'урок',
  'урока',
  'уроку',
  'lesson',
];

function hasCategoryWord(text: string, categoryWords: string[]) {
  const tokens = text.split(' ');
  const compact = tokens.join('');

  return categoryWords.some((word) => {
    const normalized = normalizeSpeech(word);
    return tokens.includes(normalized) || compact.includes(normalized);
  });
}

export function parseSpokenNumber(text: string) {
  const normalized = normalizeSpeech(text);
  if (!normalized) {
    return null;
  }

  const tokens = normalized.split(' ');
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

export function interpretExerciseAnswer(transcript: string): number | null {
  const normalized = normalizeSpeech(transcript);
  if (!normalized) {
    return null;
  }

  const fromFullPhrase = parseSpokenNumber(normalized);
  if (fromFullPhrase !== null) {
    return fromFullPhrase;
  }

  for (const token of normalized.split(' ')) {
    const fromToken = parseSpokenNumber(token);
    if (fromToken !== null) {
      return fromToken;
    }
  }

  const digitMatch = normalized.match(/\d+/);
  if (digitMatch) {
    return Number(digitMatch[0]);
  }

  return null;
}

export type SpokenItemOption = {
  id: string;
  names: string[];
};

export type ItemCommandResult =
  | { kind: 'match'; id: string }
  | { kind: 'unknown' }
  | { kind: 'none' };

function interpretNamedNumberedCommand(
  transcript: string,
  items: SpokenItemOption[],
  categoryWords: string[],
): ItemCommandResult {
  const text = normalizeSpeech(transcript);
  if (!text || items.length === 0) {
    return { kind: 'none' };
  }

  let bestName: { id: string; length: number } | null = null;

  for (const item of items) {
    for (const name of item.names) {
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
        bestName = { id: item.id, length: normalizedName.length };
      }
    }
  }

  if (bestName) {
    return { kind: 'match', id: bestName.id };
  }

  const spokenNumber = parseSpokenNumber(text);
  if (spokenNumber !== null) {
    const item = items[spokenNumber - 1];
    if (item) {
      return { kind: 'match', id: item.id };
    }

    return { kind: 'unknown' };
  }

  if (hasCategoryWord(text, categoryWords)) {
    return { kind: 'unknown' };
  }

  return { kind: 'none' };
}

export type SectionCommandResult = ItemCommandResult;

export function interpretSectionCommand(
  transcript: string,
  sections: SpokenSectionOption[],
): SectionCommandResult {
  return interpretNamedNumberedCommand(transcript, sections, SECTION_WORDS);
}

export type SpokenLessonOption = SpokenItemOption;

export type LessonCommandResult = ItemCommandResult;

export function interpretLessonCommand(
  transcript: string,
  lessons: SpokenLessonOption[],
): LessonCommandResult {
  return interpretNamedNumberedCommand(transcript, lessons, LESSON_WORDS);
}

const SKIP_TO_EXERCISES_PHRASES = [
  'skip to exercises',
  'skip to assignments',
  'skip the lesson',
  'skip lesson',
  'skip the video',
  'skip video',
  'go to exercises',
  'go to assignments',
  'start exercises',
  'start assignments',
  'skip',
  'exercises',
  'assignments',
  'перейдем сразу к заданиям',
  'перейдём сразу к заданиям',
  'перейдем к заданиям',
  'перейдём к заданиям',
  'сразу к заданиям',
  'к заданиям',
  'к упражнениям',
  'пропусти урок',
  'пропустить урок',
  'пропусти видео',
  'пропустить видео',
  'пропусти',
  'пропустить',
  'задания',
  'упражнения',
  'тапсырмаларға өт',
  'тапсырмаға өт',
  'тапсырмаларға',
  'сабақты өткіз',
  'сабакты откиз',
  'видеоны өткіз',
  'өткізіп жібер',
  'откизип жибер',
  'өткіз',
  'откиз',
  'тапсырмалар',
];

export function wantsSkipToExercises(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return SKIP_TO_EXERCISES_PHRASES.some((phrase) => {
    const normalized = normalizeSpeech(phrase);
    const normalizedCompact = normalized.replace(/\s/g, '');

    if (normalized.length <= 4) {
      return tokens.includes(normalized);
    }

    return (
      tokens.includes(normalized) ||
      compact.includes(normalizedCompact) ||
      text.includes(normalized)
    );
  });
}

const SEEK_FORWARD_PHRASES = [
  'forward',
  'вперед',
  'алға',
  'алга',
  'alga',
  'skip forward',
  'skip ahead',
  'ten seconds forward',
  '10 seconds forward',
  'перемотай вперед',
  'перемотать вперед',
  'на 10 секунд вперед',
];

const SEEK_BACK_PHRASES = [
  'back',
  'rewind',
  'назад',
  'артқа',
  'артка',
  'artka',
  'artqa',
  'skip back',
  'ten seconds back',
  '10 seconds back',
  'перемотай назад',
  'перемотать назад',
  'на 10 секунд назад',
];

function matchesCommandPhrases(transcript: string, phrases: string[]) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return phrases.some((phrase) => {
    const normalized = normalizeSpeech(phrase);
    const normalizedCompact = normalized.replace(/\s/g, '');

    if (normalized.length <= 4) {
      return tokens.includes(normalized);
    }

    return (
      tokens.includes(normalized) ||
      compact.includes(normalizedCompact) ||
      text.includes(normalized)
    );
  });
}

export function wantsSeekForward(transcript: string) {
  return matchesCommandPhrases(transcript, SEEK_FORWARD_PHRASES);
}

export function wantsSeekBack(transcript: string) {
  return matchesCommandPhrases(transcript, SEEK_BACK_PHRASES);
}

const STOP_VIDEO_PHRASES = [
  'stop',
  'стоп',
  'тоқта',
  'токта',
  'pause',
  'пауза',
  'останови',
  'остановить',
  'тоқтат',
  'токтат',
];

const RESUME_VIDEO_PHRASES = [
  'continue',
  'resume',
  'play',
  'продолжи',
  'продолжить',
  'дальше',
  'жалғастыр',
  'жалгастыр',
  'жалғастыру',
  'ойнату',
  'ойнат',
];

export function wantsStopVideo(transcript: string) {
  return matchesCommandPhrases(transcript, STOP_VIDEO_PHRASES);
}

export function wantsResumeVideo(transcript: string) {
  return matchesCommandPhrases(transcript, RESUME_VIDEO_PHRASES);
}
