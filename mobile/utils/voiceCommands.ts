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
