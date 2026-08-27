import { Language } from '../types';

type TranslationValue = string | { [key: string]: TranslationValue };

const translations: Record<Language, TranslationValue> = {
  kk: {
    app: {
      name: 'Математика',
      tagline: 'Незрячілерге арналған математика оқыту',
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

export const languageOptions: Language[] = ['kk', 'ru', 'en'];
