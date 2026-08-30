-- Alan Math Learning App — PostgreSQL schema + seed data
--
-- ONLY for an EMPTY database. If tables already exist, you will get:
--   ERROR: relation "users" already exists
--
-- Your database is already set up? Do NOT run this file again.
--
-- To recreate everything from scratch:
--   psql -U postgres -d alan -f reset.sql
--   psql -U postgres -d alan -f init.sql
--
-- Fresh install (new empty database):
--   psql -U postgres -d alan -f init.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Users & auth (nickname only)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    nickname    VARCHAR(50) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_tokens (
    token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_preferences (
    user_id                 INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language                VARCHAR(5) NOT NULL DEFAULT 'kk' CHECK (language IN ('kk', 'ru', 'en')),
    last_opened_module_id   VARCHAR(50)
);

-- ---------------------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------------------

CREATE TABLE modules (
    id          VARCHAR(50) PRIMARY KEY,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE module_translations (
    id          SERIAL PRIMARY KEY,
    module_id   VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    language    VARCHAR(5) NOT NULL CHECK (language IN ('kk', 'ru', 'en')),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    UNIQUE (module_id, language)
);

CREATE TABLE sections (
    id          VARCHAR(50) PRIMARY KEY,
    module_id   VARCHAR(50) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE section_translations (
    id          SERIAL PRIMARY KEY,
    section_id  VARCHAR(50) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    language    VARCHAR(5) NOT NULL CHECK (language IN ('kk', 'ru', 'en')),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    UNIQUE (section_id, language)
);

CREATE TABLE section_voice_aliases (
    id          SERIAL PRIMARY KEY,
    section_id  VARCHAR(50) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    alias       VARCHAR(100) NOT NULL
);

CREATE TABLE lessons (
    id          VARCHAR(50) PRIMARY KEY,
    section_id  VARCHAR(50) NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    sort_order  INT NOT NULL DEFAULT 0,
    video_url   VARCHAR(500)
);

CREATE TABLE lesson_translations (
    id          SERIAL PRIMARY KEY,
    lesson_id   VARCHAR(50) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    language    VARCHAR(5) NOT NULL CHECK (language IN ('kk', 'ru', 'en')),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    UNIQUE (lesson_id, language)
);

CREATE TABLE exercises (
    id          VARCHAR(50) PRIMARY KEY,
    lesson_id   VARCHAR(50) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('addition', 'subtraction', 'multiplication', 'division')),
    a           INT NOT NULL,
    b           INT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE lesson_progress (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id   VARCHAR(50) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    score       INT NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, lesson_id)
);

ALTER TABLE user_preferences
    ADD CONSTRAINT user_preferences_last_module_fk
    FOREIGN KEY (last_opened_module_id) REFERENCES modules(id) ON DELETE SET NULL;

CREATE INDEX idx_sections_module ON sections(module_id);
CREATE INDEX idx_lessons_section ON lessons(section_id);
CREATE INDEX idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_section_voice_aliases_section ON section_voice_aliases(section_id);

-- ---------------------------------------------------------------------------
-- Seed: modules
-- ---------------------------------------------------------------------------

INSERT INTO modules (id, sort_order) VALUES
    ('module-basic', 1);

INSERT INTO module_translations (module_id, language, title, description) VALUES
    ('module-basic', 'kk', 'Негізгі арифметика', 'Қосу мен алу — алғашқы қадамдар'),
    ('module-basic', 'ru', 'Базовая арифметика', 'Сложение и вычитание — первые шаги'),
    ('module-basic', 'en', 'Basic arithmetic', 'Addition and subtraction — first steps');

-- ---------------------------------------------------------------------------
-- Seed: sections
-- ---------------------------------------------------------------------------

INSERT INTO sections (id, module_id, sort_order) VALUES
    ('section-add-subtract', 'module-basic', 1),
    ('section-multiply',     'module-basic', 2),
    ('section-divide',       'module-basic', 3);

INSERT INTO section_translations (section_id, language, title, description) VALUES
    ('section-add-subtract', 'kk', 'Қосу және алу', 'Оң санмен қарапайым есептер'),
    ('section-add-subtract', 'ru', 'Сложение и вычитание', 'Простые задачи с положительными числами'),
    ('section-add-subtract', 'en', 'Addition and subtraction', 'Simple problems with positive numbers'),
    ('section-multiply', 'kk', 'Көбейту', 'Кіші сандарды көбейту'),
    ('section-multiply', 'ru', 'Умножение', 'Умножение небольших чисел'),
    ('section-multiply', 'en', 'Multiplication', 'Multiplying small numbers'),
    ('section-divide', 'kk', 'Бөлу', 'Санды қалдықсыз бөлу'),
    ('section-divide', 'ru', 'Деление', 'Деление без остатка'),
    ('section-divide', 'en', 'Division', 'Dividing with no remainder');

INSERT INTO section_voice_aliases (section_id, alias) VALUES
    ('section-add-subtract', 'қосу'),
    ('section-add-subtract', 'алу'),
    ('section-add-subtract', 'сложение'),
    ('section-add-subtract', 'вычитание'),
    ('section-add-subtract', 'addition'),
    ('section-add-subtract', 'subtraction'),
    ('section-add-subtract', 'add'),
    ('section-add-subtract', 'subtract'),
    ('section-multiply', 'көбейту'),
    ('section-multiply', 'кобейту'),
    ('section-multiply', 'умножение'),
    ('section-multiply', 'умножения'),
    ('section-multiply', 'multiplication'),
    ('section-multiply', 'multiply'),
    ('section-divide', 'бөлу'),
    ('section-divide', 'деление'),
    ('section-divide', 'деления'),
    ('section-divide', 'division'),
    ('section-divide', 'divide');

-- ---------------------------------------------------------------------------
-- Seed: lessons
-- ---------------------------------------------------------------------------

INSERT INTO lessons (id, section_id, sort_order, video_url) VALUES
    ('lesson-addition',       'section-add-subtract', 1, 'https://www.youtube.com/watch?v=aPg-eeg7xmo'),
    ('lesson-subtraction',    'section-add-subtract', 2, NULL),
    ('lesson-mixed',          'section-add-subtract', 3, NULL),
    ('lesson-multiplication', 'section-multiply',     1, NULL),
    ('lesson-division',       'section-divide',       1, NULL);

INSERT INTO lesson_translations (lesson_id, language, title, description) VALUES
    ('lesson-addition', 'kk', 'Қосу негіздері', 'Екі санны қосу'),
    ('lesson-addition', 'ru', 'Основы сложения', 'Сложение двух чисел'),
    ('lesson-addition', 'en', 'Addition basics', 'Adding two numbers'),
    ('lesson-subtraction', 'kk', 'Алу негіздері', 'Кіші санны алу'),
    ('lesson-subtraction', 'ru', 'Основы вычитания', 'Вычитание меньшего числа'),
    ('lesson-subtraction', 'en', 'Subtraction basics', 'Subtracting a smaller number'),
    ('lesson-mixed', 'kk', 'Аралас тапсырма', 'Қосу мен алуды бірге шешу'),
    ('lesson-mixed', 'ru', 'Смешанная практика', 'Сложение и вычитание вместе'),
    ('lesson-mixed', 'en', 'Mixed practice', 'Addition and subtraction together'),
    ('lesson-multiplication', 'kk', 'Көбейту негіздері', 'Екі санны көбейту'),
    ('lesson-multiplication', 'ru', 'Основы умножения', 'Умножение двух чисел'),
    ('lesson-multiplication', 'en', 'Multiplication basics', 'Multiplying two numbers'),
    ('lesson-division', 'kk', 'Бөлу негіздері', 'Санны қалдықсыз бөлу'),
    ('lesson-division', 'ru', 'Основы деления', 'Деление без остатка'),
    ('lesson-division', 'en', 'Division basics', 'Dividing with no remainder');

-- ---------------------------------------------------------------------------
-- Seed: exercises

INSERT INTO exercises (id, lesson_id, type, a, b, sort_order) VALUES
    ('add-1', 'lesson-addition', 'addition', 2, 1, 1),
    ('add-2', 'lesson-addition', 'addition', 3, 2, 2),
    ('add-3', 'lesson-addition', 'addition', 4, 4, 3),
    ('add-4', 'lesson-addition', 'addition', 1, 5, 4),
    ('add-5', 'lesson-addition', 'addition', 7, 2, 5),

    ('sub-1', 'lesson-subtraction', 'subtraction', 5, 2, 1),
    ('sub-2', 'lesson-subtraction', 'subtraction', 8, 3, 2),
    ('sub-3', 'lesson-subtraction', 'subtraction', 10, 4, 3),
    ('sub-4', 'lesson-subtraction', 'subtraction', 7, 1, 4),
    ('sub-5', 'lesson-subtraction', 'subtraction', 9, 5, 5),

    ('mix-1', 'lesson-mixed', 'addition', 3, 4, 1),
    ('mix-2', 'lesson-mixed', 'subtraction', 8, 3, 2),
    ('mix-3', 'lesson-mixed', 'addition', 2, 6, 3),
    ('mix-4', 'lesson-mixed', 'subtraction', 10, 7, 4),
    ('mix-5', 'lesson-mixed', 'addition', 4, 5, 5),

    ('mul-1', 'lesson-multiplication', 'multiplication', 2, 3, 1),
    ('mul-2', 'lesson-multiplication', 'multiplication', 3, 3, 2),
    ('mul-3', 'lesson-multiplication', 'multiplication', 4, 2, 3),
    ('mul-4', 'lesson-multiplication', 'multiplication', 5, 2, 4),
    ('mul-5', 'lesson-multiplication', 'multiplication', 3, 4, 5),

    ('div-1', 'lesson-division', 'division', 6, 2, 1),
    ('div-2', 'lesson-division', 'division', 8, 2, 2),
    ('div-3', 'lesson-division', 'division', 9, 3, 3),
    ('div-4', 'lesson-division', 'division', 10, 5, 4),
    ('div-5', 'lesson-division', 'division', 12, 4, 5);

COMMIT;
