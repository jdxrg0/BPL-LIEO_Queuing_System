// @ts-nocheck
export {};
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const DB_PATH = path.join(__dirname, '../../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

const backupDatabase = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      console.warn('[DB Backup] Source database not found. Skipping backup.');
      return;
    }

    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(BACKUP_DIR, `dev_backup_${timestamp}.db`);

    // Copy file
    fs.copyFileSync(DB_PATH, backupFile);
    logger.info(`[DB Backup] Database backed up successfully to ${backupFile}`);

    // Cleanup old backups (keep last 30)
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('dev_backup_') && f.endsWith('.db'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      const toDelete = files.slice(30);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
        logger.info(`[DB Backup] Deleted old backup: ${file.name}`);
      }
    }
  } catch (error) {
    logger.error('[DB Backup] Failed to backup database:', error);
  }
};

const initAutomatedBackups = () => {
  // Run every night at 12:00 AM
  cron.schedule('0 0 * * *', () => {
    logger.info('[DB Backup] Running scheduled nightly backup...');
    backupDatabase();
  });
  logger.info('[DB Backup] Automated nightly backups initialized.');
};

module.exports = { initAutomatedBackups, backupDatabase };



