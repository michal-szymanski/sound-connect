import type { Auth } from 'auth';

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: {
        user: Auth['$Infer']['Session']['user'];
    };
};
