-- Change the first-lesson intro video.
-- Video URLs live in lessons.video_url.
--
-- Usage:
--   psql -U postgres -d alan -f update_addition_lesson_video.sql

UPDATE lessons
SET video_url = 'https://www.youtube.com/watch?v=aPg-eeg7xmo'
WHERE id = 'lesson-addition';
