import { Language } from '../types';

type TranslationValue = string | { [key: string]: TranslationValue };

const translations: Record<Language, TranslationValue> = {
  kk: {
    app: {
      name: 'Математика',
      tagline: 'Зағип жандарға арналған математика оқыту',
    },
    common: {
      back: 'Артқа',
      continue: 'Жалғастыру',
      finish: 'Аяқтау',
      tryAgain: 'Қайта байқау',
      language: 'Тіл',
      lesson: 'Сабақ',
      section: 'Бөлім',
      module: 'Модуль',
      progress: 'Прогресс',
      of: 'ішінен',
      correct: 'Дұрыс!',
      wrong: 'Қате. Дұрыс жауап:',
      lessonComplete: 'Сабақ аяқталды!',
      score: 'Нәтиже',
      exercises: 'тапсырма',
      openLesson: 'Сабақты ашу',
      openSection: 'Бөлімді ашу',
      openModule: 'Модульді ашу',
      completed: 'Аяқталды',
      notStarted: 'Басталмаған',
      inProgress: 'Жалғасуда',
    },
    voice: {
      assistant: 'Дауыстық көмекші',
      greeting: 'Сәлем, досым! Бүгін математика оқуға дайынсың ба?',
      progressNotStarted: 'Сіз әлі бастаған жоқсыз. Бірінші модуль: {{module}}.',
      progressAtModule: 'Сіз тоқтаған жер. Модуль: {{module}}.',
      askCommand: 'Алан деп айтыңыз. Сосын: модульге көш. Артқа — кері оралу. Тіл — тілді ауыстыру.',
      openingModule: 'Бірінші модульді ашамын.',
      nowOnPage: 'Қазір сіз беттесізде: {{page}}.',
      homePageName: 'Басты бет',
      speaking: 'Сөйлеп тұрмын',
      listening: 'Тыңдап тұрмын',
      idle: 'Дайын',
      waiting: 'Алан деп айтыңыз',
      heard: 'Естідім',
      didNotUnderstand: 'Түсінбедім. Алан деп айтыңыз. Модульге көш. Артқа. Немесе тіл.',
      repeat: 'Қайта тыңдау',
      listen: 'Тыңдау',
      thinking: 'Танып жатырмын',
      error: 'Қате болды. Интернетті тексеріп, қайта тыңдаңыз.',
      micDenied: 'Микрофонға рұқсат беріңіз. Сонда дауыс командалары жұмыс істейді.',
      unavailable: 'SpeechKit кілті табылмады. Модульді экрандағы батырмамен ашыңыз.',
      askWhichLanguage: 'Қандай тілге ауыстырайын?',
      alreadyThisLanguage: 'Бұл тіл қазірдің өзінде таңдалған.',
      didNotUnderstandLanguage: 'Түсінбедім. Қазақша, орысша немесе ағылшынша деп айтыңыз.',
    },
    modules: {
      basicArithmetic: {
        title: 'Негізгі арифметика',
        description: 'Қосу мен алу — алғашқы қадамдар',
      },
    },
    sections: {
      addSubtract: {
        title: 'Қосу және алу',
        description: 'Оң санмен қарапайым есептер',
      },
    },
    lessons: {
      additionBasics: {
        title: 'Қосу негіздері',
        description: 'Екі санны қосу',
      },
      subtractionBasics: {
        title: 'Алу негіздері',
        description: 'Кіші санны алу',
      },
      mixedPractice: {
        title: 'Аралас тапсырма',
        description: 'Қосу мен алуды бірге шешу',
      },
    },
    exercise: {
      questionAddition: '{{a}} + {{b}} = ?',
      questionSubtraction: '{{a}} − {{b}} = ?',
      chooseAnswer: 'Жауапты таңдаңыз',
      exerciseProgress: 'Тапсырма {{current}} / {{total}}',
    },
    languages: {
      kk: 'Қазақша',
      ru: 'Орысша',
      en: 'Ағылшынша',
    },
  },
  ru: {
    app: {
      name: 'Математика',
      tagline: 'Обучение математике для незрячих',
    },
    common: {
      back: 'Назад',
      continue: 'Продолжить',
      finish: 'Завершить',
      tryAgain: 'Попробовать снова',
      language: 'Язык',
      lesson: 'Урок',
      section: 'Раздел',
      module: 'Модуль',
      progress: 'Прогресс',
      of: 'из',
      correct: 'Верно!',
      wrong: 'Неверно. Правильный ответ:',
      lessonComplete: 'Урок завершён!',
      score: 'Результат',
      exercises: 'заданий',
      openLesson: 'Открыть урок',
      openSection: 'Открыть раздел',
      openModule: 'Открыть модуль',
      completed: 'Завершено',
      notStarted: 'Не начато',
      inProgress: 'В процессе',
    },
    voice: {
      assistant: 'Голосовой помощник',
      greeting: 'Привет, друг! Готов сегодня учить математику?',
      progressNotStarted: 'Вы ещё не начинали. Первый модуль: {{module}}.',
      progressAtModule: 'Вы остановились на модуле: {{module}}.',
      askCommand: 'Скажите «Алан». Затем: модульге көш. «Артқа» — назад. «Язык» — сменить язык.',
      openingModule: 'Открываю первый модуль.',
      nowOnPage: 'Сейчас вы на странице: {{page}}.',
      homePageName: 'Главная',
      speaking: 'Говорю',
      listening: 'Слушаю',
      idle: 'Готов',
      waiting: 'Скажите «Алан»',
      heard: 'Услышал',
      didNotUnderstand: 'Не понял. Скажите «Алан». Модульге көш. «Артқа». Или «язык».',
      repeat: 'Повторить',
      listen: 'Слушать',
      thinking: 'Распознаю',
      error: 'Произошла ошибка. Проверьте интернет и нажмите «Слушать».',
      micDenied: 'Разрешите доступ к микрофону, чтобы команды работали.',
      unavailable: 'Ключ SpeechKit не найден. Откройте модуль кнопкой на экране.',
      askWhichLanguage: 'На какой язык переключить?',
      alreadyThisLanguage: 'Этот язык уже выбран.',
      didNotUnderstandLanguage: 'Не понял. Скажите: казахский, русский или английский.',
    },
    modules: {
      basicArithmetic: {
        title: 'Базовая арифметика',
        description: 'Сложение и вычитание — первые шаги',
      },
    },
    sections: {
      addSubtract: {
        title: 'Сложение и вычитание',
        description: 'Простые задачи с положительными числами',
      },
    },
    lessons: {
      additionBasics: {
        title: 'Основы сложения',
        description: 'Сложение двух чисел',
      },
      subtractionBasics: {
        title: 'Основы вычитания',
        description: 'Вычитание меньшего числа',
      },
      mixedPractice: {
        title: 'Смешанная практика',
        description: 'Сложение и вычитание вместе',
      },
    },
    exercise: {
      questionAddition: '{{a}} + {{b}} = ?',
      questionSubtraction: '{{a}} − {{b}} = ?',
      chooseAnswer: 'Выберите ответ',
      exerciseProgress: 'Задание {{current}} / {{total}}',
    },
    languages: {
      kk: 'Казахский',
      ru: 'Русский',
      en: 'Английский',
    },
  },
  en: {
    app: {
      name: 'Math',
      tagline: 'Math learning for visually impaired users',
    },
    common: {
      back: 'Back',
      continue: 'Continue',
      finish: 'Finish',
      tryAgain: 'Try again',
      language: 'Language',
      lesson: 'Lesson',
      section: 'Section',
      module: 'Module',
      progress: 'Progress',
      of: 'of',
      correct: 'Correct!',
      wrong: 'Wrong. Correct answer:',
      lessonComplete: 'Lesson complete!',
      score: 'Score',
      exercises: 'exercises',
      openLesson: 'Open lesson',
      openSection: 'Open section',
      openModule: 'Open module',
      completed: 'Completed',
      notStarted: 'Not started',
      inProgress: 'In progress',
    },
    voice: {
      assistant: 'Voice assistant',
      greeting: 'Hello, friend! Ready to study math today?',
      progressNotStarted: 'You have not started a module yet. The first module is {{module}}.',
      progressAtModule: 'You stopped at the module {{module}}.',
      askCommand: 'Say Alan. Then say open module. Say back to go back. Say language to change the language.',
      openingModule: 'Opening the first module.',
      nowOnPage: 'You are now on the page {{page}}.',
      homePageName: 'Home',
      speaking: 'Speaking',
      listening: 'Listening',
      idle: 'Ready',
      waiting: 'Say Alan',
      heard: 'I heard',
      didNotUnderstand: 'I did not understand. Say Alan. Open module. Or say back. Or say language.',
      repeat: 'Repeat greeting',
      listen: 'Listen',
      thinking: 'Recognizing',
      error: 'Something went wrong. Check the internet and try again.',
      micDenied: 'Please allow microphone access so voice commands can work.',
      unavailable:
        'Add a free Groq API key to .env for English voice commands. You can still open the module with the button on the screen.',
      askWhichLanguage: 'Which language should I switch to?',
      alreadyThisLanguage: 'This language is already selected.',
      didNotUnderstandLanguage: 'I did not understand. Say Kazakh, Russian, or English.',
    },
    modules: {
      basicArithmetic: {
        title: 'Basic arithmetic',
        description: 'Addition and subtraction — first steps',
      },
    },
    sections: {
      addSubtract: {
        title: 'Addition and subtraction',
        description: 'Simple problems with positive numbers',
      },
    },
    lessons: {
      additionBasics: {
        title: 'Addition basics',
        description: 'Adding two numbers',
      },
      subtractionBasics: {
        title: 'Subtraction basics',
        description: 'Subtracting a smaller number',
      },
      mixedPractice: {
        title: 'Mixed practice',
        description: 'Addition and subtraction together',
      },
    },
    exercise: {
      questionAddition: '{{a}} + {{b}} = ?',
      questionSubtraction: '{{a}} − {{b}} = ?',
      chooseAnswer: 'Choose an answer',
      exerciseProgress: 'Exercise {{current}} / {{total}}',
    },
    languages: {
      kk: 'Kazakh',
      ru: 'Russian',
      en: 'English',
    },
  },
};

function getNestedValue(tree: TranslationValue, path: string): string | undefined {
  const parts = path.split('.');
  let current: TranslationValue = tree;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === 'string' ? current : undefined;
}

export function translate(
  language: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  const value =
    getNestedValue(translations[language], key) ??
    getNestedValue(translations.en, key) ??
    key;

  if (!params) {
    return value;
  }

  return Object.entries(params).reduce(
    (text, [paramKey, paramValue]) =>
      text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue)),
    value,
  );
}

export const languageOptions: Language[] = ['en', 'kk', 'ru'];
