-- Seed script for TiDB
-- Run this after migrations to populate initial data

-- Insert a default form
INSERT INTO forms (id, slug, title, status, created_at, updated_at)
VALUES (
  'form-001',
  'gift-selection',
  'Choose Your Gift',
  'open',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  status = VALUES(status),
  updated_at = CURRENT_TIMESTAMP;

-- Insert sample gifts (using the images from public/images)
INSERT INTO gifts (id, form_id, code, name, description, image_key, status, sort_order, version, created_at, updated_at)
VALUES
  ('gift-001', 'form-001', 'GIFT001', 'Gift 1', 'Gift option 1', 'images/1.png', 'available', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-002', 'form-001', 'GIFT002', 'Gift 2', 'Gift option 2', 'images/2.png', 'available', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-003', 'form-001', 'GIFT003', 'Gift 3', 'Gift option 3', 'images/3.png', 'available', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-004', 'form-001', 'GIFT004', 'Gift 4', 'Gift option 4', 'images/4.png', 'available', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-005', 'form-001', 'GIFT005', 'Gift 5', 'Gift option 5', 'images/5.png', 'available', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-006', 'form-001', 'GIFT006', 'Gift 6', 'Gift option 6', 'images/6.png', 'available', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-007', 'form-001', 'GIFT007', 'Gift 7', 'Gift option 7', 'images/7.png', 'available', 7, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-008', 'form-001', 'GIFT008', 'Gift 8', 'Gift option 8', 'images/8.jpg', 'available', 8, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-009', 'form-001', 'GIFT009', 'Gift 9', 'Gift option 9', 'images/9.jpg', 'available', 9, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-010', 'form-001', 'GIFT010', 'Gift 10', 'Gift option 10', 'images/10.jpg', 'available', 10, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-011', 'form-001', 'GIFT011', 'Gift 11', 'Gift option 11', 'images/11.jpg', 'available', 11, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-012', 'form-001', 'GIFT012', 'Gift 12', 'Gift option 12', 'images/12.jpg', 'available', 12, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-013', 'form-001', 'GIFT013', 'Gift 13', 'Gift option 13', 'images/13.jpg', 'available', 13, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-014', 'form-001', 'GIFT014', 'Gift 14', 'Gift option 14', 'images/14.jpg', 'available', 14, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-015', 'form-001', 'GIFT015', 'Gift 15', 'Gift option 15', 'images/15.jpg', 'available', 15, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-016', 'form-001', 'GIFT016', 'Gift 16', 'Gift option 16', 'images/16.jpg', 'available', 16, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-017', 'form-001', 'GIFT017', 'Gift 17', 'Gift option 17', 'images/17.jpg', 'available', 17, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-018', 'form-001', 'GIFT018', 'Gift 18', 'Gift option 18', 'images/18.jpg', 'available', 18, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-019', 'form-001', 'GIFT019', 'Gift 19', 'Gift option 19', 'images/19.jpg', 'available', 19, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-020', 'form-001', 'GIFT020', 'Gift 20', 'Gift option 20', 'images/20.jpg', 'available', 20, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-021', 'form-001', 'GIFT021', 'Gift 21', 'Gift option 21', 'images/21.jpg', 'available', 21, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-022', 'form-001', 'GIFT022', 'Gift 22', 'Gift option 22', 'images/22.jpg', 'available', 22, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-023', 'form-001', 'GIFT023', 'Gift 23', 'Gift option 23', 'images/23.jpg', 'available', 23, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-024', 'form-001', 'GIFT024', 'Gift 24', 'Gift option 24', 'images/24.jpg', 'available', 24, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-025', 'form-001', 'GIFT025', 'Gift 25', 'Gift option 25', 'images/25.jpg', 'available', 25, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-026', 'form-001', 'GIFT026', 'Gift 26', 'Gift option 26', 'images/26.jpg', 'available', 26, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-027', 'form-001', 'GIFT027', 'Gift 27', 'Gift option 27', 'images/27.jpg', 'available', 27, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-028', 'form-001', 'GIFT028', 'Gift 28', 'Gift option 28', 'images/28.jpg', 'available', 28, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-029', 'form-001', 'GIFT029', 'Gift 29', 'Gift option 29', 'images/29.jpg', 'available', 29, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gift-030', 'form-001', 'GIFT030', 'Gift 30', 'Gift option 30', 'images/30.jpg', 'available', 30, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  image_key = VALUES(image_key),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  updated_at = CURRENT_TIMESTAMP;
