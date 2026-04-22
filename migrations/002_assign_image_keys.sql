-- Assign image keys to gifts based on sort order
-- This migration maps gifts to their corresponding images in public/images/
-- Uses sort_order directly since it should be sequential

-- First fix any existing image keys that have the wrong format (remove 'images/' prefix)
UPDATE gifts
SET image_key = REPLACE(image_key, 'images/', ''),
    updated_at = CURRENT_TIMESTAMP
WHERE image_key LIKE 'images/%';

-- Then assign image keys to gifts that don't have them
UPDATE gifts
SET image_key = CASE 
  WHEN sort_order < 7 THEN CONCAT(sort_order + 1, '.png')
  ELSE CONCAT(sort_order + 1, '.jpg')
END,
    updated_at = CURRENT_TIMESTAMP
WHERE form_id = 'form-001'
  AND image_key IS NULL;
