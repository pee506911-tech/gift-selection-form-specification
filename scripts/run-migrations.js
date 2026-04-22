#!/usr/bin/env node
/**
 * Run database migrations for TiDB
 * Usage: node scripts/run-migrations.js
 * 
 * This script runs all SQL files in the migrations/ directory in order
 */

import { connect } from '@tidbcloud/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
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
    // Create migrations table if it doesn't exist
    console.log('📊 Setting up migrations tracking...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_migration_name (name)
      )
    `);
    console.log('✅ Migrations table ready');

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically to ensure order

    console.log(`📁 Found ${files.length} migration files`);

    // Check which migrations have already been applied
    const appliedMigrations = await conn.execute('SELECT name FROM migrations ORDER BY id');
    const appliedNames = new Set();
    
    if (appliedMigrations && Array.isArray(appliedMigrations)) {
      appliedMigrations.forEach(migration => {
        appliedNames.add(migration.name);
      });
    }

    console.log(`📋 ${appliedNames.size} migrations already applied`);

    // Run pending migrations
    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`⏭️  Skipping already applied: ${file}`);
        continue;
      }

      console.log(`🚀 Applying migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        // Execute the migration
        await conn.execute(sql);
        
        // Record the migration as applied
        await conn.execute('INSERT INTO migrations (name) VALUES (?)', [file]);
        
        console.log(`✅ Applied: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to apply migration ${file}:`, error.message);
        console.error('Migration SQL:', sql);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    
    // Show final status
    const finalStatus = await conn.execute(`
      SELECT 
        COUNT(*) as total_migrations,
        GROUP_CONCAT(name ORDER BY id) as applied_migrations
      FROM migrations
    `);
    
    if (finalStatus && Array.isArray(finalStatus) && finalStatus.length > 0) {
      console.log(`📊 Total applied migrations: ${finalStatus[0].total_migrations}`);
      console.log(`📝 Applied migrations: ${finalStatus[0].applied_migrations || 'None'}`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigrations();