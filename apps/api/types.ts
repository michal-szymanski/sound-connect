import type { Auth } from '@/api/better-auth/auth';

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: {
        user: Auth['$Infer']['Session']['user'];
    };
};
