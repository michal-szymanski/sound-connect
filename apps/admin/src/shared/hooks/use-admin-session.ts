import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { getAdminSession } from '@/shared/server-functions/auth';

export const adminSessionQuery = () =>
    queryOptions({
        queryKey: ['admin-session'],
        queryFn: async () => {
            const result = await getAdminSession();

            if (result.success) {
                return result.body;
            }

            return { user: null };
        }
    });

export const useAdminSession = () => useSuspenseQuery(adminSessionQuery());
