import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, accounts } from './better-auth';
import { resolve, dirname } from 'path';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as schema from './schema';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEST_USERS = [
    {
        id: 'qNsCKabaSy0rH16ncmCU73FxnCQR4T4z',
        accountId: 'x7tz5E5psSwqcItSh1ajgHU2b9tz0AdX',
        name: 't1',
        email: 't1@asd.asd',
        hashedPassword:
            'f28e7368b7da338841ba16ccd7bb75e0:0af56534358ae85f36137d9a9f92f1e7e8ed8478bc04578a65eab179ca7aed42cee3cfc371ea772612569a38c1438ec5e94ace3fd0d72542d33a1161a6a30c0a'
    },
    {
        id: 'SCQDH9YOqtVkPZDt7q4yTJEjCkE2YhC4',
        accountId: '6tvh7z70mJNq14aoZyndj1yJmXtCDOHv',
        name: 't2',
        email: 't2@asd.asd',
        hashedPassword:
            '0f1bc53654ea4574c661c7a4f79f1feb:72957aa8abbc8909625b6c5a47096612eaaaa59e54803c4a957b65961964cdcd58e173e1c4a666793e7cd009e0d0bbf7607ffc5c56af1d8325fa8db3a0d638ed'
    }
] as const;

const PLAYWRIGHT_USERS = [
    {
        id: 'Ojb9Yu5WQSUwUAWPFgOeOaCyHvu6eU7o',
        accountId: 'ngEGUH3YuK6dqqJ46seqmm4qZwlEy0T0',
        name: 'Playwright User 1',
        email: 'pw1@test.test',
        hashedPassword:
            '443eb652dd5ce6c2829ef82ec3ecd054:a5566cbc5216a19e204ccc69191f00807a1b2fe9310d94f61e2778ae7dc2a7f0d7648d04779db89aa50c82fca3bcc4e631398d176fa207944d419f921673d8d0'
    },
    {
        id: 'ObTL2d1Sy7xBIKmr5WSo5u7zcP6qk6cK',
        accountId: 'FgEuv9lLVjA43UEE1zE9GyRkZsC5j4YV',
        name: 'Playwright User 2',
        email: 'pw2@test.test',
        hashedPassword:
            'e44d68022b74bd067e2667a2f1c8c9f1:bd5a1499d431ca7be8bec84422a452816ff8afbec702e0c290f0f0ab227eeb0b78d88a0b9db32aca667bf0937b6ae8b1a090424b6fa73ed076d717d11e211afe'
    }
] as const;

const ADMIN_USER = {
    id: '4qQw1Wlz0F6MUFsFupkPkUcrR5j3oh0i',
    accountId: 'I88RYhN8JX7g0l2iwTZgVKG6psPxxs17',
    name: 'Admin',
    email: 'michal.szymanski92@gmail.com',
    username: 'admin',
    role: 'admin',
    hashedPassword:
        'c0cf207f052e9fdc9bb6d79b64960d74:f51c949415811855e45e56efce1741a7b34ddaf2528d0432732fc94786f3e13b6d4236d9a2b9feced5fd8c3f846fa00211b70068b3559a269b0651331b7ebb23'
} as const;

const ALL_TEST_USERS = [...TEST_USERS, ...PLAYWRIGHT_USERS, ADMIN_USER];

function findLocalDatabase(): string {
    const wranglerDir = resolve(__dirname, '../../../apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject');

    const files = readdirSync(wranglerDir);
    const dbFile = files.find((file) => file.endsWith('.sqlite'));

    if (!dbFile) {
        throw new Error(`No SQLite database found in ${wranglerDir}`);
    }

    return resolve(wranglerDir, dbFile);
}

function createLocalDb(): BetterSQLite3Database<typeof schema> {
    const dbPath = findLocalDatabase();
    console.log(`Found local database at: ${dbPath}`);

    const sqlite = new Database(dbPath);
    return drizzle(sqlite, { schema });
}

type DbInstance = BetterSQLite3Database<typeof schema>;

async function seedWithDrizzle(db: DbInstance) {
    console.log('Checking for existing users...');
    const existingUsers = await db.select().from(users);

    if (existingUsers.length > 0) {
        console.log(`Found ${existingUsers.length} existing users. Skipping seed (idempotent).`);
        return;
    }

    console.log('Inserting test users...');

    for (const user of ALL_TEST_USERS) {
        const now = new Date();

        await db.insert(users).values({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: true,
            image: null,
            username: 'username' in user ? user.username : null,
            role: 'role' in user ? user.role : null,
            createdAt: now,
            updatedAt: now,
            lastActiveAt: null
        });

        await db.insert(accounts).values({
            id: user.accountId,
            accountId: user.id,
            providerId: 'credential',
            userId: user.id,
            password: user.hashedPassword,
            createdAt: now,
            updatedAt: now,
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null
        });

        console.log(`  ✓ Created user: ${user.name} (${user.email})`);
    }

    console.log('Seed completed successfully!');
    console.log(`Total users created: ${ALL_TEST_USERS.length}`);
}

async function seedRemoteWithWrangler() {
    console.log('Seeding remote database via Wrangler...');

    const apiDir = resolve(__dirname, '../../../apps/api');

    console.log('Checking for existing users...');
    const checkUsersQuery = 'SELECT COUNT(*) as count FROM users';
    const checkResult = execSync(`wrangler d1 execute sound-connect-db --remote --command "${checkUsersQuery}" --config wrangler.jsonc`, {
        cwd: apiDir,
        encoding: 'utf-8'
    });

    if (checkResult.includes('"count": 0') === false) {
        console.log('Users already exist in remote database. Skipping seed (idempotent).');
        return;
    }

    console.log('Inserting test users...');

    for (const user of ALL_TEST_USERS) {
        const now = Date.now();

        const username = 'username' in user ? user.username : null;
        const role = 'role' in user ? user.role : null;

        const insertUserSQL = `INSERT INTO users (id, name, email, email_verified, image, username, role, created_at, updated_at, last_active_at) VALUES ('${user.id}', '${user.name}', '${user.email}', 1, NULL, ${username ? `'${username}'` : 'NULL'}, ${role ? `'${role}'` : 'NULL'}, ${now}, ${now}, NULL)`;

        execSync(`wrangler d1 execute sound-connect-db --remote --command "${insertUserSQL}" --config wrangler.jsonc`, {
            cwd: apiDir,
            encoding: 'utf-8'
        });

        const insertAccountSQL = `INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope) VALUES ('${user.accountId}', '${user.id}', 'credential', '${user.id}', '${user.hashedPassword}', ${now}, ${now}, NULL, NULL, NULL, NULL, NULL, NULL)`;

        execSync(`wrangler d1 execute sound-connect-db --remote --command "${insertAccountSQL}" --config wrangler.jsonc`, {
            cwd: apiDir,
            encoding: 'utf-8'
        });

        console.log(`  ✓ Created user: ${user.name} (${user.email})`);
    }

    console.log('Seed completed successfully!');
    console.log(`Total users created: ${ALL_TEST_USERS.length}`);
}

async function seed() {
    console.log('Starting database seeding...');

    const isRemote = process.argv.includes('--remote');

    if (isRemote) {
        await seedRemoteWithWrangler();
    } else {
        const db = createLocalDb();
        await seedWithDrizzle(db);
    }
}

seed().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});
