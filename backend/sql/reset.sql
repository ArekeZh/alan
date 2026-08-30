-- Drop all Alan tables (DESTROYS ALL DATA)
-- Run before init.sql if you need to recreate the database from scratch.
-- Usage: psql -U postgres -d alan -f reset.sql

BEGIN;

DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS lesson_translations CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS section_voice_aliases CASCADE;
DROP TABLE IF EXISTS section_translations CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS module_translations CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

COMMIT;
