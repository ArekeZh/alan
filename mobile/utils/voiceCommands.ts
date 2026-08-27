export function normalizeSpeech(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:"'«»()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const MODULE_WORDS = ['модуль', 'модул', 'modul', 'module'];

export function wantsOpenFirstModule(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const compact = text.replace(/\s/g, '');
  return MODULE_WORDS.some((word) => text.includes(word) || compact.includes(word));
}
