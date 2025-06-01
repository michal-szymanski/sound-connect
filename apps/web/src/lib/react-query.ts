import { QueryClient, queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Follower, Following, User, UserDTO } from '@sound-connect/common/types/models';
import { getFeed, getFollowers, getFollowings, getMutualFollowers, getReactions, getUser, search } from '@/web/server-functions/models';
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
    queryOptions({
        queryKey: ['feed'],
        queryFn: async () => {
            const result = await getFeed();

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const useFeed = () => useSuspenseQuery(feedQuery());

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

export const useMutualFollowers = () => {
    const queryClient = new QueryClient();
    return useQuery({
        queryKey: ['mutual-followers'],
        queryFn: async () => {
            const followers = queryClient.getQueryData<Follower[]>(['followers']) ?? [];
            const followings = queryClient.getQueryData<Following[]>(['followings']) ?? [];
            const commonIds = followings.filter(({ userId }) => followers.some(({ followedUserId }) => userId === followedUserId)).map(({ userId }) => userId);
            return commonIds;
        }
    });
};

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

export const searchQuery = (query: string) =>
    queryOptions({
        queryKey: ['search', query],
        queryFn: async () => {
            if (!query) {
                return [];
            }

            const result = await search({ data: { query } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const useSearch = (query: string) => useQuery(searchQuery(query));
