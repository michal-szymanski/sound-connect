import { queryOptions, useQuery } from '@tanstack/react-query';
import { User } from '@/web/types/auth';
import { getFeed, getFollowings, getMutualFollowers, getReactions } from '@/web/server-functions/models';
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

export const feedQueryOptions = () =>
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

export const userQueryOptions = (user: User | null) =>
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

export const useEnvs = () =>
    useQuery({
        queryKey: ['envs'],
        queryFn: async () => {
            const result = await getEnvs();

            if (result.success) {
                return result.body;
            }

            return null;
        }
    });

export const useMutualFollowers = (user: User | null) =>
    useQuery({
        queryKey: ['mutual-followers'],
        queryFn: async () => {
            if (!user) {
                return [];
            }

            const result = await getMutualFollowers({ data: { userId: user.id } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const followingsQuery = (userId: string) =>
    queryOptions({
        queryKey: ['followings'],
        queryFn: async () => {
            const result = await getFollowings({ data: { userId } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });
