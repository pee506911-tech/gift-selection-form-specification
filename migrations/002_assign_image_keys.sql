-- Assign image keys to gifts based on sort order
-- This migration maps gifts to their corresponding images in public/images/
-- Uses sort_order directly since it should be sequential

UPDATE gifts
SET image_key = CASE 
  WHEN sort_order < 7 THEN CONCAT(sort_order + 1, '.png')
  ELSE CONCAT(sort_order + 1, '.jpg')
END,
    updated_at = CURRENT_TIMESTAMP
WHERE form_id = 'default-form-id'
  AND image_key IS NULL;
