import { QueryClient, queryOptions, useQuery, useSuspenseQuery, infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { User, UserDTO } from '@sound-connect/common/types/models';
import { getFeedPaginated, getFollowers, getFollowings, getReactions, search, getFollowRequestStatus } from '@/web/server-functions/models';
import { getSession } from '@/web/server-functions/auth';
import { getEnvs } from '@/web/server-functions/utils';

export const useReactions = ({ postId }: { postId: number }) =>
    useQuery({
        queryKey: ['reactions', postId],
        queryFn: async () => {
            const result = await getReactions({ data: { postId } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const feedQuery = () =>
    infiniteQueryOptions({
        queryKey: ['feed-infinite'],
        queryFn: async ({ pageParam }) => {
            const result = await getFeedPaginated({ data: { limit: 10, offset: pageParam } });

            if (result.success) {
                return result.body;
            }

            return [];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 10) {
                return undefined;
            }
            return allPages.length * 10;
        }
    });

export const useFeed = () => useInfiniteQuery(feedQuery());

export const userQuery = (user?: User | UserDTO | null) =>
    queryOptions({
        queryKey: ['user'],
        queryFn: async () => {
            if (user) {
                return user;
            }

            const result = await getSession();

            if (result.success) {
                return result.body;
            }

            return null;
        }
    });

export const useUser = () => useSuspenseQuery(userQuery());

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
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 5 // 5 minutes
    });

export const useFollowRequestStatus = (userId: string) => {
    return useQuery(followRequestStatusQuery(userId));
};
