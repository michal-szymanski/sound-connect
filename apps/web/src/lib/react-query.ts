import { queryOptions, useQuery } from '@tanstack/react-query';
import { User } from '@/web/types/auth';
import { getFeed, getReactions } from '@/web/server-functions/models';
import { getSession } from '@/web/server-functions/auth';

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
