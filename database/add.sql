UPDATE profiles
SET is_setup = TRUE
WHERE gender IS NOT NULL
  AND preference IS NOT NULL
  AND age IS NOT NULL
  AND biography IS NOT NULL;