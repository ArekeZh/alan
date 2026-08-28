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
      askCommand: 'Астыңғы ақ жерді түртіңіз. Сосын айтыңыз: модульге көш. Артқа — кері оралу. Тіл — тілді ауыстыру.',
      openingModule: 'Бірінші модульді ашамын.',
      enteredModule:
        'Сіз модульдесіз: {{module}}. Қандай бөлімдер бар екенін есту үшін «ақпарат» деп айтыңыз.',
      sectionListItem: '{{ordinal}} бөлім) {{name}}',
      openingSection: '{{section}} бөлімін ашамын.',
      unknownSection: 'Мұндай бөлім жоқ. Тізімді есту үшін «ақпарат» деп айтыңыз.',
      enteredSection:
        'Сіз {{section}} бөліміндесіз. Қандай сабақтар бар екенін есту үшін «ақпарат» деп айтыңыз.',
      lessonListItem: '{{ordinal}} сабақ) {{name}}',
      openingLesson: '{{lesson}} сабағын ашамын.',
      unknownLesson: 'Мұндай сабақ жоқ. Тізімді есту үшін «ақпарат» деп айтыңыз.',
      didNotUnderstandOnModule:
        'Түсінбедім. Астыңғы ақ жерді түртіп айтыңыз. Ақпарат — бөлімдер тізімі. Немесе бөлімнің атын немесе нөмірін айтыңыз.',
      didNotUnderstandOnSection:
        'Түсінбедім. Астыңғы ақ жерді түртіп айтыңыз. Ақпарат — сабақтар тізімі. Немесе сабақтың атын немесе нөмірін айтыңыз.',
      ordinal: {
        '1': 'бірінші',
        '2': 'екінші',
        '3': 'үшінші',
        '4': 'төртінші',
        '5': 'бесінші',
        '6': 'алтыншы',
        '7': 'жетінші',
        '8': 'сегізінші',
        '9': 'тоғызыншы',
        '10': 'оныншы',
      },
      nowOnPage: 'Қазір сіз беттесізде: {{page}}.',
      homePageName: 'Басты бет',
      speaking: 'Сөйлеп тұрмын',
      listening: 'Тыңдап тұрмын',
      idle: 'Дайын',
      waiting: 'Сөйлеу үшін төменгі ақ жерді түртіңіз',
      heard: 'Естідім',
      didNotUnderstand: 'Түсінбедім. Астыңғы ақ жерді түртіңіз. Модульге көш. Артқа. Немесе тіл.',
      repeat: 'Қайта тыңдау',
      listen: 'Тыңдау',
      stopListening: 'Тоқтату',
      tapToSpeak: 'Сөйлеу үшін түртіңіз',
      tapToStop: 'Тоқтату үшін түртіңіз',
      thinking: 'Танып жатырмын',
      error: 'Қате болды. Интернетті тексеріп, қайта тыңдаңыз.',
      micDenied: 'Микрофонға рұқсат беріңіз. Сонда дауыс командалары жұмыс істейді.',
      unavailable: 'SpeechKit кілті табылмады. Модульді экрандағы батырмамен ашыңыз.',
      askWhichLanguage: 'Қандай тілге ауыстырайын?',
      alreadyThisLanguage: 'Бұл тіл қазірдің өзінде таңдалған.',
      didNotUnderstandLanguage: 'Түсінбедім. Қазақша, орысша немесе ағылшынша деп айтыңыз.',
      micOn: 'Микрофон қосулы. Көмекші тыңдап тұр.',
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
      multiply: {
        title: 'Көбейту',
        description: 'Кіші сандарды көбейту',
      },
      divide: {
        title: 'Бөлу',
        description: 'Санды қалдықсыз бөлу',
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
      multiplicationBasics: {
        title: 'Көбейту негіздері',
        description: 'Екі санны көбейту',
      },
      divisionBasics: {
        title: 'Бөлу негіздері',
        description: 'Санны қалдықсыз бөлу',
      },
    },
    exercise: {
      questionAddition: '{{a}} + {{b}} = ?',
      questionSubtraction: '{{a}} − {{b}} = ?',
      questionMultiplication: '{{a}} × {{b}} = ?',
      questionDivision: '{{a}} ÷ {{b}} = ?',
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
      askCommand: 'Нажмите белую полосу внизу. Затем скажите: модульге көш. «Артқа» — назад. «Язык» — сменить язык.',
      openingModule: 'Открываю первый модуль.',
      enteredModule:
        'Вы в модуле {{module}}. Чтобы услышать, какие разделы доступны, скажите «информация».',
      sectionListItem: '{{ordinal}} раздел) {{name}}',
      openingSection: 'Открываю раздел {{section}}.',
      unknownSection: 'Такого раздела нет. Чтобы услышать список, скажите «информация».',
      enteredSection:
        'Вы в разделе {{section}}. Чтобы услышать список уроков, скажите «информация».',
      lessonListItem: '{{ordinal}} урок) {{name}}',
      openingLesson: 'Открываю урок {{lesson}}.',
      unknownLesson: 'Такого урока нет. Чтобы услышать список, скажите «информация».',
      didNotUnderstandOnModule:
        'Не понял. Нажмите белую полосу внизу и скажите. «Информация» — список разделов. Или назовите раздел или его номер.',
      didNotUnderstandOnSection:
        'Не понял. Нажмите белую полосу внизу и скажите. «Информация» — список уроков. Или назовите урок или его номер.',
      ordinal: {
        '1': 'первый',
        '2': 'второй',
        '3': 'третий',
        '4': 'четвёртый',
        '5': 'пятый',
        '6': 'шестой',
        '7': 'седьмой',
        '8': 'восьмой',
        '9': 'девятый',
        '10': 'десятый',
      },
      nowOnPage: 'Сейчас вы на странице: {{page}}.',
      homePageName: 'Главная',
      speaking: 'Говорю',
      listening: 'Слушаю',
      idle: 'Готов',
      waiting: 'Нажмите белую полосу внизу, чтобы говорить',
      heard: 'Услышал',
      didNotUnderstand: 'Не понял. Нажмите белую полосу внизу. Модульге көш. «Артқа». Или «язык».',
      repeat: 'Повторить',
      listen: 'Слушать',
      stopListening: 'Остановить',
      tapToSpeak: 'Нажмите, чтобы говорить',
      tapToStop: 'Нажмите, чтобы остановить',
      thinking: 'Распознаю',
      error: 'Произошла ошибка. Проверьте интернет и нажмите «Слушать».',
      micDenied: 'Разрешите доступ к микрофону, чтобы команды работали.',
      unavailable: 'Ключ SpeechKit не найден. Откройте модуль кнопкой на экране.',
      askWhichLanguage: 'На какой язык переключить?',
      alreadyThisLanguage: 'Этот язык уже выбран.',
      didNotUnderstandLanguage: 'Не понял. Скажите: казахский, русский или английский.',
      micOn: 'Микрофон включён. Помощник слушает.',
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
      multiply: {
        title: 'Умножение',
        description: 'Умножение небольших чисел',
      },
      divide: {
        title: 'Деление',
        description: 'Деление без остатка',
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
      multiplicationBasics: {
        title: 'Основы умножения',
        description: 'Умножение двух чисел',
      },
      divisionBasics: {
        title: 'Основы деления',
        description: 'Деление без остатка',
      },
    },
    exercise: {
      questionAddition: '{{a}} + {{b}} = ?',
      questionSubtraction: '{{a}} − {{b}} = ?',
      questionMultiplication: '{{a}} × {{b}} = ?',
      questionDivision: '{{a}} ÷ {{b}} = ?',
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
      askCommand: 'Tap the white bar at the bottom. Then say open module. Say back to go back. Say language to change the language.',
      openingModule: 'Opening the first module.',
      enteredModule:
        'You are in the module {{module}}. To hear which sections are available, say information.',
      sectionListItem: '{{ordinal}} section) {{name}}',
      openingSection: 'Opening the section {{section}}.',
      unknownSection: 'There is no such section. To hear the list, say information.',
      enteredSection:
        'You are in the section {{section}}. To hear the list of lessons, say information.',
      lessonListItem: '{{ordinal}} lesson) {{name}}',
      openingLesson: 'Opening the lesson {{lesson}}.',
      unknownLesson: 'There is no such lesson. To hear the list, say information.',
      didNotUnderstandOnModule:
        'I did not understand. Tap the white bar at the bottom and speak. Say information for the list of sections. Or say the section name or number.',
      didNotUnderstandOnSection:
        'I did not understand. Tap the white bar at the bottom and speak. Say information for the list of lessons. Or say the lesson name or number.',
      ordinal: {
        '1': 'first',
        '2': 'second',
        '3': 'third',
        '4': 'fourth',
        '5': 'fifth',
        '6': 'sixth',
        '7': 'seventh',
        '8': 'eighth',
        '9': 'ninth',
        '10': 'tenth',
      },
      nowOnPage: 'You are now on the page {{page}}.',
      homePageName: 'Home',
      speaking: 'Speaking',
      listening: 'Listening',
      idle: 'Ready',
      waiting: 'Tap the white bar at the bottom to speak',
      heard: 'I heard',
      didNotUnderstand: 'I did not understand. Tap the white bar at the bottom. Open module. Or say back. Or say language.',
      repeat: 'Repeat greeting',
      listen: 'Listen',
      stopListening: 'Stop',
      tapToSpeak: 'Tap to speak',
      tapToStop: 'Tap to stop',
      thinking: 'Recognizing',
      error: 'Something went wrong. Check the internet and try again.',
      micDenied: 'Please allow microphone access so voice commands can work.',
      unavailable:
        'Add a free Groq API key to .env for English voice commands. You can still open the module with the button on the screen.',
      askWhichLanguage: 'Which language should I switch to?',
      alreadyThisLanguage: 'This language is already selected.',
      didNotUnderstandLanguage: 'I did not understand. Say Kazakh, Russian, or English.',
      micOn: 'Microphone is on. The assistant is listening.',
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
      multiply: {
        title: 'Multiplication',
        description: 'Multiplying small numbers',
      },
      divide: {
        title: 'Division',
        description: 'Dividing with no remainder',
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
      multiplicationBasics: {
        title: 'Multiplication basics',
        description: 'Multiplying two numbers',
      },
      divisionBasics: {
        title: 'Division basics',
        description: 'Dividing with no remainder',
      },
    },
    exercise: {
      questionAddition: '{{a}} + {{b}} = ?',
      questionSubtraction: '{{a}} − {{b}} = ?',
      questionMultiplication: '{{a}} × {{b}} = ?',
      questionDivision: '{{a}} ÷ {{b}} = ?',
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
