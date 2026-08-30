-- Remove multiple-choice answer options from exercises.
-- Students answer by voice only; correct answer is computed from type, a, b.

BEGIN;

ALTER TABLE exercises DROP COLUMN IF EXISTS options;

COMMIT;
