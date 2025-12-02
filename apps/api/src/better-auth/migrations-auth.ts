// oxlint-disable no-explicit-any
import { drizzle } from 'drizzle-orm/d1';
import { createAuth } from './auth';
import { schema } from '@/drizzle';

const fakeDb = drizzle<typeof schema>({} as any, { schema });

const fakeQueue: Queue = {
    send: async () => {},
    sendBatch: async () => {}
};

const auth = createAuth({ db: fakeDb, queue: fakeQueue, apiUrl: '', clientUrl: '', secret: '' });

export default auth;
