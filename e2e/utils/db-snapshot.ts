import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { TEST_USERS } from './auth';

const API_DIR = path.join(process.cwd(), '..', 'apps', 'api');
const WRANGLER_STATE_DIR = path.join(API_DIR, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

const MIGRATION_SEEDED_USER_IDS = {
    T1: 'xGvICj1532ArhGacyObqzE1bkEounP0y',
    T2: 'keUzTIdaFlWWWgiG61OC5nLza3cbIyWN'
};

type DbFile = {
    original: string;
    snapshot: string;
};

function getDbFiles(): DbFile[] {
    if (!fs.existsSync(WRANGLER_STATE_DIR)) {
        throw new Error(`Wrangler state directory not found: ${WRANGLER_STATE_DIR}. Make sure the dev server has run at least once.`);
    }

    const files = fs.readdirSync(WRANGLER_STATE_DIR);
    const sqliteFiles = files.filter((file) => file.endsWith('.sqlite'));

    if (sqliteFiles.length === 0) {
        throw new Error(`No SQLite database files found in ${WRANGLER_STATE_DIR}. Make sure migrations have been applied.`);
    }

    return sqliteFiles.map((file) => {
        const baseName = file.replace('.sqlite', '');
        return {
            original: path.join(WRANGLER_STATE_DIR, `${baseName}.sqlite`),
            snapshot: path.join(WRANGLER_STATE_DIR, `${baseName}.sqlite.snapshot`)
        };
    });
}

export function cleanTestData(): void {
    const startTime = Date.now();
    console.log('🧹 Cleaning test data from database...');

    const testUserIds = Object.values(TEST_USERS).map((u) => u.id);
    const migrationUserIds = Object.values(MIGRATION_SEEDED_USER_IDS);
    const preservedUserIds = [...testUserIds, ...migrationUserIds];
    const userIdList = preservedUserIds.map((id) => `'${id}'`).join(',');

    const dbFiles = getDbFiles();
    const dbFile = dbFiles[0];

    if (!dbFile) {
        throw new Error('No database files found');
    }

    const dbPath = dbFile.original;

    const queries = [
        `DELETE FROM notifications;`,
        `DELETE FROM users_followers;`,
        `DELETE FROM posts_reactions;`,
        `DELETE FROM comments_reactions;`,
        `DELETE FROM comments;`,
        `DELETE FROM media;`,
        `DELETE FROM posts;`,
        `DELETE FROM messages;`,
        `DELETE FROM music_groups_followers;`,
        `DELETE FROM music_groups_members;`,
        `DELETE FROM music_groups;`,
        `DELETE FROM sessions WHERE user_id NOT IN (${userIdList});`,
        `DELETE FROM accounts WHERE user_id NOT IN (${userIdList});`,
        `DELETE FROM verifications WHERE identifier NOT IN (${userIdList});`,
        `DROP TRIGGER IF EXISTS users_ai;`,
        `DROP TRIGGER IF EXISTS users_ad;`,
        `DROP TRIGGER IF EXISTS users_au;`,
        `DELETE FROM users WHERE id NOT IN (${userIdList});`,
        `DELETE FROM users_fts WHERE rowid NOT IN (SELECT rowid FROM users);`,
        `CREATE TRIGGER users_ai AFTER INSERT ON users BEGIN INSERT INTO users_fts(rowid, name) VALUES (new.rowid, new.name); END;`,
        `CREATE TRIGGER users_ad AFTER DELETE ON users BEGIN INSERT INTO users_fts(users_fts, rowid) VALUES('delete', old.rowid); END;`,
        `CREATE TRIGGER users_au AFTER UPDATE ON users BEGIN INSERT INTO users_fts(users_fts, rowid) VALUES('delete', old.rowid); INSERT INTO users_fts(rowid, name) VALUES(new.rowid, new.name); END;`
    ];

    for (const query of queries) {
        try {
            execSync(`sqlite3 "${dbPath}" "${query}"`, {
                cwd: API_DIR,
                stdio: 'pipe'
            });
        } catch (error) {
            console.error(`   ⚠️  Warning executing query: ${query.substring(0, 50)}...`);
            console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Test data cleaned successfully in ${duration}s\n`);
}

export function createSnapshot(): void {
    const startTime = Date.now();
    console.log('📸 Creating database snapshot...');

    const dbFiles = getDbFiles();

    for (const { original, snapshot } of dbFiles) {
        if (!fs.existsSync(original)) {
            throw new Error(`Database file not found: ${original}`);
        }

        fs.copyFileSync(original, snapshot);
        console.log(`   ✓ Created snapshot: ${path.basename(snapshot)}`);

        const shmFile = original.replace('.sqlite', '.sqlite-shm');
        const walFile = original.replace('.sqlite', '.sqlite-wal');
        const shmSnapshot = snapshot.replace('.sqlite.snapshot', '.sqlite-shm.snapshot');
        const walSnapshot = snapshot.replace('.sqlite.snapshot', '.sqlite-wal.snapshot');

        if (fs.existsSync(shmFile)) {
            fs.copyFileSync(shmFile, shmSnapshot);
            console.log(`   ✓ Created snapshot: ${path.basename(shmSnapshot)}`);
        }

        if (fs.existsSync(walFile)) {
            fs.copyFileSync(walFile, walSnapshot);
            console.log(`   ✓ Created snapshot: ${path.basename(walSnapshot)}`);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Database snapshot created successfully in ${duration}s\n`);
}

export function snapshotExists(): boolean {
    try {
        const dbFiles = getDbFiles();
        return dbFiles.every(({ snapshot }) => fs.existsSync(snapshot));
    } catch {
        return false;
    }
}

export function cleanupSnapshots(): void {
    const startTime = Date.now();
    console.log('🧹 Cleaning up database snapshots...');

    if (!fs.existsSync(WRANGLER_STATE_DIR)) {
        console.log('   ⚠️  No wrangler state directory found, nothing to clean up\n');
        return;
    }

    const files = fs.readdirSync(WRANGLER_STATE_DIR);
    const snapshotFiles = files.filter((file) => file.includes('.snapshot'));

    for (const file of snapshotFiles) {
        const filePath = path.join(WRANGLER_STATE_DIR, file);
        fs.unlinkSync(filePath);
        console.log(`   ✓ Deleted: ${file}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (snapshotFiles.length > 0) {
        console.log(`✅ Snapshots cleaned up successfully in ${duration}s\n`);
    } else {
        console.log('   ℹ️  No snapshots found to clean up\n');
    }
}
