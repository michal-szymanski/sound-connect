import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UserDTO } from '@/common/types/models';
import { followUser, unfollowUser } from '../server-functions/users';
import { useAuth } from '../lib/react-query';

export const useFollowUser = (userId: string) => {
    const queryClient = useQueryClient();
    const { data: auth } = useAuth();

    return useMutation({
        mutationFn: async () => {
            const result = await followUser({ data: { userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to follow user');
            }
            return result.body;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['followings', auth?.user?.id] });

            const previousFollowings = queryClient.getQueryData<UserDTO[]>(['followings', auth?.user?.id]);

            if (previousFollowings) {
                const userToAdd = queryClient.getQueryData<UserDTO>(['user', userId]);

                if (userToAdd) {
                    queryClient.setQueryData<UserDTO[]>(['followings', auth?.user?.id], [...previousFollowings, userToAdd]);
                }
            }

            return { previousFollowings };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['follow-request-status', userId] });
            queryClient.refetchQueries({ queryKey: ['followers', userId] }, { cancelRefetch: false });
            queryClient.refetchQueries({ queryKey: ['user', userId] }, { cancelRefetch: false });
        },
        onError: (error, _variables, context) => {
            if (context?.previousFollowings) {
                queryClient.setQueryData(['followings', auth?.user?.id], context.previousFollowings);
            }
            toast.error(error instanceof Error ? error.message : 'Failed to follow user');
        }
    });
};

export const useUnfollowUser = (userId: string) => {
    const queryClient = useQueryClient();
    const { data: auth } = useAuth();

    return useMutation({
        mutationFn: async () => {
            const result = await unfollowUser({ data: { userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to unfollow user');
            }
            return result.body;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['followings', auth?.user?.id] });

            const previousFollowings = queryClient.getQueryData<UserDTO[]>(['followings', auth?.user?.id]);

            if (previousFollowings) {
                queryClient.setQueryData<UserDTO[]>(
                    ['followings', auth?.user?.id],
                    previousFollowings.filter((user) => user.id !== userId)
                );
            }

            return { previousFollowings };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['follow-request-status', userId] });
            queryClient.refetchQueries({ queryKey: ['followers', userId] }, { cancelRefetch: false });
            queryClient.refetchQueries({ queryKey: ['user', userId] }, { cancelRefetch: false });
            toast.success('Unfollowed successfully');
        },
        onError: (error, _variables, context) => {
            if (context?.previousFollowings) {
                queryClient.setQueryData(['followings', auth?.user?.id], context.previousFollowings);
            }
            toast.error(error instanceof Error ? error.message : 'Failed to unfollow user');
        }
    });
};
