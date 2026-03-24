import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { sequelize } from '../models';
import { QueryInterface, Sequelize, QueryTypes } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface, sequelize: typeof Sequelize) => Promise<void>;
  down: (queryInterface: QueryInterface, sequelize: typeof Sequelize) => Promise<void>;
}

interface MigrationRecord {
  name: string;
}

const migrationsPath = path.join(__dirname, 'migrations');

async function loadMigration(filePath: string): Promise<Migration> {
  const fileUrl = pathToFileURL(filePath).href;
  const module = await import(fileUrl);
  return module.default || module;
}

async function runMigrations(): Promise<void> {
  const isUndo = process.argv.includes('undo');

  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "name" VARCHAR(255) PRIMARY KEY,
        "executedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((f) => f.endsWith('.js'))
      .sort();

    if (isUndo) {
      const executed = await sequelize.query<MigrationRecord>(
        'SELECT name FROM "_migrations" ORDER BY name DESC LIMIT 1',
        { type: QueryTypes.SELECT }
      );

      if (!executed || executed.length === 0) {
        console.log('No migrations to undo.');
        process.exit(0);
      }

      const lastMigration = executed[0].name;
      const migration = await loadMigration(path.join(migrationsPath, lastMigration));

      console.log(`Undoing migration: ${lastMigration}`);
      await migration.down(sequelize.getQueryInterface(), Sequelize);
      await sequelize.query('DELETE FROM "_migrations" WHERE name = ?', {
        replacements: [lastMigration],
      });
      console.log(`Migration undone: ${lastMigration}`);
    } else {
      const executed = await sequelize.query<MigrationRecord>(
        'SELECT name FROM "_migrations"',
        { type: QueryTypes.SELECT }
      );
      const executedNames = (executed || []).map((r: MigrationRecord) => r.name);

      for (const file of migrationFiles) {
        if (!executedNames.includes(file)) {
          console.log(`Running migration: ${file}`);
          const migration = await loadMigration(path.join(migrationsPath, file));
          await migration.up(sequelize.getQueryInterface(), Sequelize);
          await sequelize.query('INSERT INTO "_migrations" (name) VALUES (?)', {
            replacements: [file],
          });
          console.log(`Migration complete: ${file}`);
        }
      }

      console.log('All migrations complete.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
