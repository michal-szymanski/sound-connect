import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const API_DIR = path.join(process.cwd(), '..', 'apps', 'api');
const WRANGLER_STATE_DIR = path.join(API_DIR, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

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
    console.log('🧹 Cleaning test data from database...');

    const dbFiles = getDbFiles();

    for (const { original } of dbFiles) {
        if (!fs.existsSync(original)) {
            continue;
        }

        try {
            execSync(`sqlite3 "${original}" "DELETE FROM users_followers; DELETE FROM notifications;"`, {
                stdio: 'pipe'
            });
            console.log(`   ✓ Cleaned: ${path.basename(original)}`);
        } catch (error) {
            console.error(`   ✗ Failed to clean ${path.basename(original)}:`, error);
        }
    }

    console.log('✅ Test data cleaned successfully\n');
}

export function createSnapshot(): void {
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

    console.log('✅ Database snapshot created successfully\n');
}

export function restoreSnapshot(): void {
    console.log('🔄 Restoring database from snapshot...');

    const dbFiles = getDbFiles();

    for (const { original, snapshot } of dbFiles) {
        if (!fs.existsSync(snapshot)) {
            throw new Error(`Snapshot file not found: ${snapshot}. Run createSnapshot() first.`);
        }

        fs.copyFileSync(snapshot, original);
        console.log(`   ✓ Restored: ${path.basename(original)}`);

        const shmFile = original.replace('.sqlite', '.sqlite-shm');
        const walFile = original.replace('.sqlite', '.sqlite-wal');
        const shmSnapshot = snapshot.replace('.sqlite.snapshot', '.sqlite-shm.snapshot');
        const walSnapshot = snapshot.replace('.sqlite.snapshot', '.sqlite-wal.snapshot');

        if (fs.existsSync(shmSnapshot)) {
            fs.copyFileSync(shmSnapshot, shmFile);
            console.log(`   ✓ Restored: ${path.basename(shmFile)}`);
        }

        if (fs.existsSync(walSnapshot)) {
            fs.copyFileSync(walSnapshot, walFile);
            console.log(`   ✓ Restored: ${path.basename(walFile)}`);
        }
    }

    console.log('✅ Database restored successfully\n');
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

    console.log(snapshotFiles.length > 0 ? '✅ Snapshots cleaned up successfully\n' : '   ℹ️  No snapshots found to clean up\n');
}
