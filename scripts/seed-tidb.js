#!/usr/bin/env node
/**
 * Seed TiDB database with initial data
 * Usage: node scripts/seed-tidb.js
 * 
 * Make sure TIDB_CONNECTION_STRING is set in your environment or .dev.vars
 */

import { connect } from '@tidbcloud/serverless';

async function seed() {
  // Get connection string from environment
  const connectionString = process.env.TIDB_CONNECTION_STRING;
  
  if (!connectionString) {
    console.error('❌ TIDB_CONNECTION_STRING environment variable is not set');
    console.error('Set it in .dev.vars or export it:');
    console.error('export TIDB_CONNECTION_STRING="mysql://..."');
    process.exit(1);
  }

  console.log('🔌 Connecting to TiDB...');
  const conn = connect({ url: connectionString });

  try {
    console.log('📝 Seeding database...\n');

    // Check if form already exists
    console.log('1️⃣  Checking for existing form...');
    const existingForm = await conn.execute('SELECT id, slug, title, status FROM forms WHERE slug = ?', ['gift-selection']);
    
    console.log('   Query result:', JSON.stringify(existingForm, null, 2));
    
    let formId;
    // The TiDB driver returns the rows directly, not in a .rows property
    if (existingForm && Array.isArray(existingForm) && existingForm.length > 0) {
      formId = existingForm[0].id;
      console.log(`✅ Form already exists with ID: ${formId}`);
      console.log('   Updating form...');
      await conn.execute(`
        UPDATE forms 
        SET title = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE slug = ?
      `, ['Choose Your Gift', 'open', 'gift-selection']);
      console.log('✅ Form updated');
    } else {
      console.log('   No existing form found, creating new one...');
      formId = 'form-001';
      
      try {
        await conn.execute(`
          INSERT INTO forms (id, slug, title, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [formId, 'gift-selection', 'Choose Your Gift', 'open']);
        console.log('✅ Form created');
      } catch (insertError) {
        // If insert fails due to duplicate, try to fetch the existing form
        if (insertError.message.includes('Duplicate entry')) {
          console.log('   Form exists but query returned no rows. Fetching again...');
          const retryForm = await conn.execute('SELECT id FROM forms WHERE slug = ?', ['gift-selection']);
          if (retryForm && Array.isArray(retryForm) && retryForm.length > 0) {
            formId = retryForm[0].id;
            console.log(`✅ Found existing form with ID: ${formId}`);
          } else {
            throw new Error('Form exists but cannot retrieve ID');
          }
        } else {
          throw insertError;
        }
      }
    }

    // Insert gifts
    console.log(`\n2️⃣  Creating gifts for form ${formId}...`);
    const gifts = [
      ['gift-001', 'GIFT001', 'Gift 1', 'Gift option 1', '1.png', 1],
      ['gift-002', 'GIFT002', 'Gift 2', 'Gift option 2', '2.png', 2],
      ['gift-003', 'GIFT003', 'Gift 3', 'Gift option 3', '3.png', 3],
      ['gift-004', 'GIFT004', 'Gift 4', 'Gift option 4', '4.png', 4],
      ['gift-005', 'GIFT005', 'Gift 5', 'Gift option 5', '5.png', 5],
      ['gift-006', 'GIFT006', 'Gift 6', 'Gift option 6', '6.png', 6],
      ['gift-007', 'GIFT007', 'Gift 7', 'Gift option 7', '7.png', 7],
      ['gift-008', 'GIFT008', 'Gift 8', 'Gift option 8', '8.jpg', 8],
      ['gift-009', 'GIFT009', 'Gift 9', 'Gift option 9', '9.jpg', 9],
      ['gift-010', 'GIFT010', 'Gift 10', 'Gift option 10', '10.jpg', 10],
      ['gift-011', 'GIFT011', 'Gift 11', 'Gift option 11', '11.jpg', 11],
      ['gift-012', 'GIFT012', 'Gift 12', 'Gift option 12', '12.jpg', 12],
      ['gift-013', 'GIFT013', 'Gift 13', 'Gift option 13', '13.jpg', 13],
      ['gift-014', 'GIFT014', 'Gift 14', 'Gift option 14', '14.jpg', 14],
      ['gift-015', 'GIFT015', 'Gift 15', 'Gift option 15', '15.jpg', 15],
      ['gift-016', 'GIFT016', 'Gift 16', 'Gift option 16', '16.jpg', 16],
      ['gift-017', 'GIFT017', 'Gift 17', 'Gift option 17', '17.jpg', 17],
      ['gift-018', 'GIFT018', 'Gift 18', 'Gift option 18', '18.jpg', 18],
      ['gift-019', 'GIFT019', 'Gift 19', 'Gift option 19', '19.jpg', 19],
      ['gift-020', 'GIFT020', 'Gift 20', 'Gift option 20', '20.jpg', 20],
      ['gift-021', 'GIFT021', 'Gift 21', 'Gift option 21', '21.jpg', 21],
      ['gift-022', 'GIFT022', 'Gift 22', 'Gift option 22', '22.jpg', 22],
      ['gift-023', 'GIFT023', 'Gift 23', 'Gift option 23', '23.jpg', 23],
      ['gift-024', 'GIFT024', 'Gift 24', 'Gift option 24', '24.jpg', 24],
      ['gift-025', 'GIFT025', 'Gift 25', 'Gift option 25', '25.jpg', 25],
      ['gift-026', 'GIFT026', 'Gift 26', 'Gift option 26', '26.jpg', 26],
      ['gift-027', 'GIFT027', 'Gift 27', 'Gift option 27', '27.jpg', 27],
      ['gift-028', 'GIFT028', 'Gift 28', 'Gift option 28', '28.jpg', 28],
      ['gift-029', 'GIFT029', 'Gift 29', 'Gift option 29', '29.jpg', 29],
      ['gift-030', 'GIFT030', 'Gift 30', 'Gift option 30', '30.jpg', 30],
    ];

    let created = 0;
    for (const [id, code, name, description, imageKey, sortOrder] of gifts) {
      await conn.execute(`
        INSERT INTO gifts (id, form_id, code, name, description, image_key, status, sort_order, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'available', ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          image_key = VALUES(image_key),
          status = VALUES(status),
          sort_order = VALUES(sort_order),
          updated_at = CURRENT_TIMESTAMP
      `, [id, formId, code, name, description, imageKey, sortOrder]);
      created++;
      process.stdout.write(`\r✅ Created ${created}/${gifts.length} gifts`);
    }
    console.log('\n');

    // Verify the form was created
    console.log('🔍 Verifying seed data...');
    const result = await conn.execute('SELECT * FROM forms WHERE slug = ?', ['gift-selection']);
    
    if (result && Array.isArray(result) && result.length > 0) {
      console.log('✅ Form "gift-selection" verified!');
      console.log('   Form ID:', result[0].id);
      console.log('   Title:', result[0].title);
      console.log('   Status:', result[0].status);
    } else {
      console.log('⚠️  Form not found after seeding.');
      process.exit(1);
    }

    // Count gifts
    const giftsResult = await conn.execute('SELECT COUNT(*) as count FROM gifts WHERE form_id = ?', [formId]);
    if (giftsResult && Array.isArray(giftsResult) && giftsResult.length > 0) {
      console.log(`✅ ${giftsResult[0].count} gifts verified`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('You can now access: /api/forms/gift-selection/bootstrap');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

seed();
