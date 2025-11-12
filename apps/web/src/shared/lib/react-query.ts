import { UserDTO } from '@/common/types/models';
import { type User } from '@/common/types/drizzle';
import { QueryClient, queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { getAuth } from '@/features/auth';
import { getFollowers, getFollowings, search, getFollowRequestStatus } from '../server-functions/users';
import { getEnvs } from '../server-functions/utils';

export const authQuery = (data?: { user: User | null; accessToken: string | undefined }) =>
    queryOptions({
        queryKey: ['user'],
        queryFn: async () => {
            if (data) {
                return data;
            }

            const result = await getAuth();

            if (result.success) {
                return result.body;
            }

            return { user: null, accessToken: undefined };
        }
    });

export const useAuth = () => useSuspenseQuery(authQuery());

export const envsQuery = () =>
    queryOptions({
        queryKey: ['envs'],
        queryFn: async () => {
            const result = await getEnvs();

            if (result.success) {
                return result.body;
            }

            return null;
        }
    });

export const useEnvs = () => useSuspenseQuery(envsQuery());

export const followingsQuery = (user?: User | UserDTO | null) =>
    queryOptions({
        queryKey: ['followings', user?.id],
        queryFn: async () => {
            if (!user) {
                return [];
            }

            const result = await getFollowings({ data: { userId: user.id } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const useFollowings = (user?: User | UserDTO | null) => useSuspenseQuery(followingsQuery(user));

export const followersQuery = (user?: User | UserDTO | null) =>
    queryOptions({
        queryKey: ['followers', user?.id],
        queryFn: async () => {
            if (!user) {
                return [];
            }

            const result = await getFollowers({ data: { userId: user.id } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const useFollowers = (user?: User | UserDTO | null) => useSuspenseQuery(followersQuery(user));

export const searchQuery = (query: string) => {
    const queryClient = new QueryClient();

    return queryOptions({
        queryKey: ['search', query],
        queryFn: async () => {
            if (!query) {
                return [];
            }

            const result = await search({ data: { query } });

            if (result.success) {
                for (const user of result.body) {
                    queryClient.setQueryData(['user', user.id], user);
                }

                return result.body;
            }

            return [];
        }
    });
};

export const useSearch = (query: string) => useQuery(searchQuery(query));

export const followRequestStatusQuery = (userId: string) =>
    queryOptions({
        queryKey: ['follow-request-status', userId],
        queryFn: async () => {
            const result = await getFollowRequestStatus({ data: { userId } });
            if (!result.success) {
                throw new Error('Failed to get follow request status');
            }
            return result.body;
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5
    });

export const useFollowRequestStatus = (userId: string) => {
    return useQuery(followRequestStatusQuery(userId));
};
