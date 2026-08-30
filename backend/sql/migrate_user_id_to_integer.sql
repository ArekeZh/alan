-- Migrate existing database from UUID user ids to integer ids (1, 2, 3...)
-- Run only if you already applied the old init.sql with UUID users.
-- WARNING: drops all user-related data and recreates tables.

BEGIN;

DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);

-- Example: create user arlan with id 1
INSERT INTO users (id, nickname, created_at)
VALUES (1, 'arlan', TIMESTAMPTZ '2026-02-01 00:00:00+05');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO auth_tokens (user_id, created_at)
VALUES (1, TIMESTAMPTZ '2026-02-01 00:00:00+05');

INSERT INTO user_preferences (user_id, language)
VALUES (1, 'kk');

COMMIT;
