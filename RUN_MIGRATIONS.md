# Run Database Migrations on TiDB

## The Problem

Your app is deployed and TiDB connection works, but the database tables don't exist yet.

**Error:** `Table 'test.forms' doesn't exist`

## The Solution

Run these 3 SQL files on your TiDB cluster in order:

### Option 1: TiDB Cloud SQL Editor (Easiest - Recommended)

1. **Go to TiDB Cloud Console:** https://tidbcloud.com/
2. **Select your cluster**
3. **Click "SQL Editor"** or **"Chat2Query"**
4. **Run each SQL file below** (copy and paste)

---

### Step 1: Create Tables

Copy and paste this entire SQL into TiDB Cloud SQL Editor:

```sql
-- migrations/001_initial_schema.sql
-- Creates all tables

CREATE TABLE IF NOT EXISTS forms (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  status ENUM('draft', 'open', 'closed') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gifts (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_key VARCHAR(255),
  sort_order INT DEFAULT 0,
  status ENUM('available', 'selected', 'inactive') DEFAULT 'available',
  selected_submission_id VARCHAR(36) NULL,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_form_gift (form_id, id),
  INDEX idx_form_id (form_id),
  INDEX idx_status (status),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  gift_id VARCHAR(36) NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  gift_name_snapshot VARCHAR(255) NOT NULL,
  status ENUM('active', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
  INDEX idx_form_id (form_id),
  INDEX idx_gift_id (gift_id),
  INDEX idx_nickname (nickname),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  actor VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(36),
  payload_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor (actor),
  INDEX idx_action (action),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Click **"Run"** or **"Execute"**

---

### Step 2: Insert Seed Data

Copy and paste this SQL (creates the form and 30 gifts):

```sql
-- Insert default form
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

-- Insert 30 gifts
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
```

Click **"Run"** or **"Execute"**

---

### Step 3: Verify

Run this query to verify:

```sql
SELECT COUNT(*) as gift_count FROM gifts;
SELECT * FROM forms;
```

You should see:
- `gift_count: 30`
- 1 form with slug `gift-selection`

---

### Option 2: Using MySQL Command Line

If you have MySQL client installed:

```bash
# Connect to TiDB
mysql -h gateway.region.prod.aws.tidbcloud.com -P 4000 -u user.root -p

# Run migrations
source migrations/001_initial_schema.sql
source scripts/seed-tidb.sql
```

---

## After Running Migrations

Your app should now work! Visit:
```
https://gift-selection-form-specification.pee506911.workers.dev/
```

The form should load with 30 gift options.

---

## Troubleshooting

### "Access denied" error
- Check your TiDB cluster is running (not paused)
- Verify you're using the correct credentials

### "Database doesn't exist"
- Make sure you're connected to the right database
- Check your connection string has the correct database name

### Still not working?
- Verify tables were created: `SHOW TABLES;`
- Check data exists: `SELECT COUNT(*) FROM gifts;`
- Check Cloudflare logs: `npx wrangler tail`
