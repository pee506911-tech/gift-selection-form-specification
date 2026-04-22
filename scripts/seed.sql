-- Seed script for gift selection database
-- Run this after migrations to populate initial data

-- Insert a default form
INSERT INTO forms (id, slug, title, status, created_at, updated_at)
VALUES (
  'form-001',
  'gift-selection',
  'Choose Your Gift',
  'open',
  datetime('now'),
  datetime('now')
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  status = excluded.status,
  updated_at = datetime('now');

-- Insert sample gifts (using the images from public/images)
INSERT INTO gifts (id, form_id, code, name, description, image_key, status, sort_order, version, created_at, updated_at)
VALUES
  ('gift-001', 'form-001', 'GIFT001', 'Gift 1', 'Gift option 1', '1.png', 'available', 1, 1, datetime('now'), datetime('now')),
  ('gift-002', 'form-001', 'GIFT002', 'Gift 2', 'Gift option 2', '2.png', 'available', 2, 1, datetime('now'), datetime('now')),
  ('gift-003', 'form-001', 'GIFT003', 'Gift 3', 'Gift option 3', '3.png', 'available', 3, 1, datetime('now'), datetime('now')),
  ('gift-004', 'form-001', 'GIFT004', 'Gift 4', 'Gift option 4', '4.png', 'available', 4, 1, datetime('now'), datetime('now')),
  ('gift-005', 'form-001', 'GIFT005', 'Gift 5', 'Gift option 5', '5.png', 'available', 5, 1, datetime('now'), datetime('now')),
  ('gift-006', 'form-001', 'GIFT006', 'Gift 6', 'Gift option 6', '6.png', 'available', 6, 1, datetime('now'), datetime('now')),
  ('gift-007', 'form-001', 'GIFT007', 'Gift 7', 'Gift option 7', '7.png', 'available', 7, 1, datetime('now'), datetime('now')),
  ('gift-008', 'form-001', 'GIFT008', 'Gift 8', 'Gift option 8', '8.jpg', 'available', 8, 1, datetime('now'), datetime('now')),
  ('gift-009', 'form-001', 'GIFT009', 'Gift 9', 'Gift option 9', '9.jpg', 'available', 9, 1, datetime('now'), datetime('now')),
  ('gift-010', 'form-001', 'GIFT010', 'Gift 10', 'Gift option 10', '10.jpg', 'available', 10, 1, datetime('now'), datetime('now')),
  ('gift-011', 'form-001', 'GIFT011', 'Gift 11', 'Gift option 11', '11.jpg', 'available', 11, 1, datetime('now'), datetime('now')),
  ('gift-012', 'form-001', 'GIFT012', 'Gift 12', 'Gift option 12', '12.jpg', 'available', 12, 1, datetime('now'), datetime('now')),
  ('gift-013', 'form-001', 'GIFT013', 'Gift 13', 'Gift option 13', '13.jpg', 'available', 13, 1, datetime('now'), datetime('now')),
  ('gift-014', 'form-001', 'GIFT014', 'Gift 14', 'Gift option 14', '14.jpg', 'available', 14, 1, datetime('now'), datetime('now')),
  ('gift-015', 'form-001', 'GIFT015', 'Gift 15', 'Gift option 15', '15.jpg', 'available', 15, 1, datetime('now'), datetime('now')),
  ('gift-016', 'form-001', 'GIFT016', 'Gift 16', 'Gift option 16', '16.jpg', 'available', 16, 1, datetime('now'), datetime('now')),
  ('gift-017', 'form-001', 'GIFT017', 'Gift 17', 'Gift option 17', '17.jpg', 'available', 17, 1, datetime('now'), datetime('now')),
  ('gift-018', 'form-001', 'GIFT018', 'Gift 18', 'Gift option 18', '18.jpg', 'available', 18, 1, datetime('now'), datetime('now')),
  ('gift-019', 'form-001', 'GIFT019', 'Gift 19', 'Gift option 19', '19.jpg', 'available', 19, 1, datetime('now'), datetime('now')),
  ('gift-020', 'form-001', 'GIFT020', 'Gift 20', 'Gift option 20', '20.jpg', 'available', 20, 1, datetime('now'), datetime('now')),
  ('gift-021', 'form-001', 'GIFT021', 'Gift 21', 'Gift option 21', '21.jpg', 'available', 21, 1, datetime('now'), datetime('now')),
  ('gift-022', 'form-001', 'GIFT022', 'Gift 22', 'Gift option 22', '22.jpg', 'available', 22, 1, datetime('now'), datetime('now')),
  ('gift-023', 'form-001', 'GIFT023', 'Gift 23', 'Gift option 23', '23.jpg', 'available', 23, 1, datetime('now'), datetime('now')),
  ('gift-024', 'form-001', 'GIFT024', 'Gift 24', 'Gift option 24', '24.jpg', 'available', 24, 1, datetime('now'), datetime('now')),
  ('gift-025', 'form-001', 'GIFT025', 'Gift 25', 'Gift option 25', '25.jpg', 'available', 25, 1, datetime('now'), datetime('now')),
  ('gift-026', 'form-001', 'GIFT026', 'Gift 26', 'Gift option 26', '26.jpg', 'available', 26, 1, datetime('now'), datetime('now')),
  ('gift-027', 'form-001', 'GIFT027', 'Gift 27', 'Gift option 27', '27.jpg', 'available', 27, 1, datetime('now'), datetime('now')),
  ('gift-028', 'form-001', 'GIFT028', 'Gift 28', 'Gift option 28', '28.jpg', 'available', 28, 1, datetime('now'), datetime('now')),
  ('gift-029', 'form-001', 'GIFT029', 'Gift 29', 'Gift option 29', '29.jpg', 'available', 29, 1, datetime('now'), datetime('now')),
  ('gift-030', 'form-001', 'GIFT030', 'Gift 30', 'Gift option 30', '30.jpg', 'available', 30, 1, datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  image_key = excluded.image_key,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = datetime('now');
