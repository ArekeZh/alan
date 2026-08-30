-- Counting lesson: add exercise illustration code, reset curriculum to one module/section/lesson.
-- Usage: psql -U postgres -d alan -f counting_lesson.sql

BEGIN;

-- ---------------------------------------------------------------------------
-- Schema: illustration code + counting exercise type
-- ---------------------------------------------------------------------------

ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS code TEXT;

ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_type_check;

ALTER TABLE exercises
    ADD CONSTRAINT exercises_type_check
    CHECK (type IN ('addition', 'subtraction', 'multiplication', 'division', 'counting'));

-- ---------------------------------------------------------------------------
-- Clear curriculum (keep users and progress table structure)
-- ---------------------------------------------------------------------------

DELETE FROM lesson_progress;

DELETE FROM exercises;
DELETE FROM lesson_translations;
DELETE FROM lessons;
DELETE FROM section_voice_aliases;
DELETE FROM section_translations;
DELETE FROM sections;
DELETE FROM module_translations;
DELETE FROM modules;

UPDATE user_preferences
SET last_opened_module_id = NULL
WHERE last_opened_module_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Module: 1 класс
-- ---------------------------------------------------------------------------

INSERT INTO modules (id, sort_order) VALUES
    ('module-grade-1', 1);

INSERT INTO module_translations (module_id, language, title, description) VALUES
    ('module-grade-1', 'kk', '1 сынып', 'Бастапқы математика'),
    ('module-grade-1', 'ru', '1 класс', 'Начальная математика'),
    ('module-grade-1', 'en', 'Grade 1', 'Elementary math');

-- ---------------------------------------------------------------------------
-- Section: 1 четверть
-- ---------------------------------------------------------------------------

INSERT INTO sections (id, module_id, sort_order) VALUES
    ('section-quarter-1', 'module-grade-1', 1);

INSERT INTO section_translations (section_id, language, title, description) VALUES
    ('section-quarter-1', 'kk', '1 тоқсан', 'Бірінші тоқсандағы сабақтар'),
    ('section-quarter-1', 'ru', '1 четверть', 'Уроки первой четверти'),
    ('section-quarter-1', 'en', '1st quarter', 'Lessons for the first quarter');

INSERT INTO section_voice_aliases (section_id, alias) VALUES
    ('section-quarter-1', '1 тоқсан'),
    ('section-quarter-1', 'тоқсан'),
    ('section-quarter-1', '1 четверть'),
    ('section-quarter-1', 'четверть'),
    ('section-quarter-1', 'первая четверть'),
    ('section-quarter-1', '1st quarter'),
    ('section-quarter-1', 'quarter');

-- ---------------------------------------------------------------------------
-- Lesson: счёт предметов (+ YouTube intro)
-- ---------------------------------------------------------------------------

INSERT INTO lessons (id, section_id, sort_order, video_url) VALUES
    ('lesson-counting', 'section-quarter-1', 1, 'https://www.youtube.com/watch?v=aPg-eeg7xmo');

INSERT INTO lesson_translations (lesson_id, language, title, description) VALUES
    ('lesson-counting', 'kk', 'Заттарды санау', 'Суреттегі заттардың санын табу'),
    ('lesson-counting', 'ru', 'Счёт предметов', 'Посчитай предметы на картинке'),
    ('lesson-counting', 'en', 'Counting objects', 'Count the objects in the picture');

-- ---------------------------------------------------------------------------
-- Exercises: 5 counting tasks (a = correct answer, b unused)
-- Bright yellow outline: #FFEA00
-- ---------------------------------------------------------------------------

INSERT INTO exercises (id, lesson_id, type, a, b, sort_order, code) VALUES
(
    'count-apples',
    'lesson-counting',
    'counting',
    3,
    0,
    1,
    $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <circle cx="0" cy="26" r="24" fill="#FF6B6B" stroke="#FFEA00" stroke-width="3"/>
    <line x1="0" y1="2" x2="0" y2="-10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="8" cy="-11" rx="7" ry="3.5" fill="#69DB7C" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(126,14)">
    <circle cx="0" cy="26" r="24" fill="#FF6B6B" stroke="#FFEA00" stroke-width="3"/>
    <line x1="0" y1="2" x2="0" y2="-10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="8" cy="-11" rx="7" ry="3.5" fill="#69DB7C" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(210,14)">
    <circle cx="0" cy="26" r="24" fill="#FF6B6B" stroke="#FFEA00" stroke-width="3"/>
    <line x1="0" y1="2" x2="0" y2="-10" stroke="#795548" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="8" cy="-11" rx="7" ry="3.5" fill="#69DB7C" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
</svg>
$svg$
),
(
    'count-toothbrushes',
    'lesson-counting',
    'counting',
    5,
    0,
    2,
    $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(126,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(210,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(294,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
  <g transform="translate(378,14)">
    <rect x="-22" y="22" width="36" height="9" rx="4.5" fill="#4DABF7" stroke="#FFEA00" stroke-width="3"/>
    <rect x="10" y="10" width="18" height="34" rx="3" fill="#F8F9FA" stroke="#FFEA00" stroke-width="3"/>
    <line x1="15" y1="14" x2="15" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="19" y1="14" x2="19" y2="40" stroke="#CED4DA" stroke-width="2"/>
    <line x1="23" y1="14" x2="23" y2="40" stroke="#CED4DA" stroke-width="2"/>
  </g>
</svg>
$svg$
),
(
    'count-pencils',
    'lesson-counting',
    'counting',
    4,
    0,
    3,
    $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336 80" role="img" aria-hidden="true">
  <g transform="translate(42,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(126,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(210,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
  <g transform="translate(294,26) rotate(-8)">
    <rect x="-22" y="-6" width="38" height="12" rx="2" fill="#FAB005" stroke="#FFEA00" stroke-width="3"/>
    <polygon points="16,-6 26,-2 26,6 16,6" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="26,-2 32,2 26,6" fill="#495057" stroke="#FFEA00" stroke-width="2.5"/>
    <rect x="-26" y="-6" width="6" height="12" rx="1.5" fill="#FF6B6B" stroke="#FFEA00" stroke-width="2.5"/>
  </g>
</svg>
$svg$
),
(
    'count-balls',
    'lesson-counting',
    'counting',
    2,
    0,
    4,
    $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <circle cx="0" cy="26" r="24" fill="#FFFFFF" stroke="#FFEA00" stroke-width="3"/>
    <path d="M0 2 V50 M-24 26 H24" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
    <circle cx="0" cy="26" r="9" fill="none" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
  </g>
  <g transform="translate(126,14)">
    <circle cx="0" cy="26" r="24" fill="#FFFFFF" stroke="#FFEA00" stroke-width="3"/>
    <path d="M0 2 V50 M-24 26 H24" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
    <circle cx="0" cy="26" r="9" fill="none" stroke="#FFEA00" stroke-width="2" opacity="0.7"/>
  </g>
</svg>
$svg$
),
(
    'count-stars',
    'lesson-counting',
    'counting',
    6,
    0,
    5,
    $svg$
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 504 80" role="img" aria-hidden="true">
  <g transform="translate(42,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(126,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(210,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(294,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(378,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
  <g transform="translate(462,14)">
    <polygon points="0,4 5,18 20,18 8,28 13,46 0,36 -13,46 -8,28 -20,18 -5,18" fill="#FFE066" stroke="#FFEA00" stroke-width="3" stroke-linejoin="round"/>
  </g>
</svg>
$svg$
);

COMMIT;
