import { queryOptions, useQuery } from '@tanstack/react-query';
import { User } from '@/web/types/auth';
import { getFeed, getReactions } from '@/web/server-functions/models';
import { getSession } from '@/web/server-functions/auth';

export const useReactions = ({ postId }: { postId: number }) =>
    useQuery({
        queryKey: ['reactions', postId],
        queryFn: async () => await getReactions({ data: { postId } })
    });

export const feedQueryOptions = () =>
    queryOptions({
        queryKey: ['feed'],
        queryFn: async () => {
            const response = await getFeed();

            if (response.success) {
                return response.body;
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

            const response = await getSession();

            if (response.success) {
                return response.body;
            }

            return null;
        }
    });
