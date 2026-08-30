-- Add intro video URL to lessons (existing databases).
-- Fresh installs already get this from init.sql — skip this file then.
--
-- Usage:
--   psql -U postgres -d alan -f add_lesson_video_url.sql

BEGIN;

ALTER TABLE lessons
    ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

UPDATE lessons
SET video_url = 'https://www.youtube.com/watch?v=aPg-eeg7xmo'
WHERE id = 'lesson-addition';

COMMIT;
