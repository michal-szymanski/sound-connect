import { useMutation, useQuery, useQueryClient, useSuspenseQuery, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import {
    createBand,
    getBand,
    updateBand,
    deleteBand,
    addBandMember,
    removeBandMember,
    getUserBands,
    createBandPost,
    getBandPosts,
    followBand,
    unfollowBand,
    getBandFollowers,
    getBandFollowerCount,
    getIsFollowingBand,
    updateBandProfileImage,
    updateBandBackgroundImage
} from '@/features/bands/server-functions/bands';
import type { CreateBandInput, UpdateBandInput } from '@sound-connect/common/types/bands';
import type { CreateBandPostInput } from '@sound-connect/common/types/band-posts';

export const useBand = (bandId: number) => {
    return useQuery({
        queryKey: ['band', bandId],
        queryFn: async () => {
            const result = await getBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load band');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const userBandsQuery = (userId: string) => ({
    queryKey: ['user-bands', userId],
    queryFn: async () => {
        const result = await getUserBands({ data: { userId } });
        if (!result.success) {
            throw new Error(result.body?.message || 'Failed to load bands');
        }
        return result.body;
    },
    staleTime: 5 * 60 * 1000
});

export const useUserBands = (userId: string) => {
    return useSuspenseQuery(userBandsQuery(userId));
};

export const useCreateBand = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (data: CreateBandInput) => {
            const result = await createBand({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to create band');
            }
            return result.body;
        },
        onSuccess: (band) => {
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
            toast.success('Band created successfully');
            navigate({ to: `/bands/${band.id}` });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateBand = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateBandInput) => {
            const result = await updateBand({ data: { ...data, bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update band');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
            toast.success('Band updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useDeleteBand = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (bandId: number) => {
            const result = await deleteBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to delete band');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
            toast.success('Band deleted successfully');
            navigate({ to: '/' });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useAddBandMember = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const result = await addBandMember({ data: { bandId, userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to add member');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            toast.success('Member added successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useRemoveBandMember = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const result = await removeBandMember({ data: { bandId, userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to remove member');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            toast.success('Member removed successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useCreateBandPost = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBandPostInput) => {
            const result = await createBandPost({ data: { ...data, bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to create post');
            }
            return result.body;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['band-posts', bandId] });
        },
        onSuccess: () => {
            toast.success('Post created successfully');

            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['band-posts', bandId] });
                queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
            }, 2000);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useBandPosts = (bandId: number) => {
    return useInfiniteQuery({
        queryKey: ['band-posts', bandId],
        queryFn: async ({ pageParam = 1 }) => {
            const result = await getBandPosts({ data: { bandId, page: pageParam, limit: 20 } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load posts');
            }
            return result.body;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
        },
        staleTime: 1 * 60 * 1000
    });
};

export const useFollowBand = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await followBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to follow band');
            }
            return result.body;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['is-following-band', bandId] });
            await queryClient.cancelQueries({ queryKey: ['band-follower-count', bandId] });

            const previousIsFollowing = queryClient.getQueryData(['is-following-band', bandId]);
            const previousCount = queryClient.getQueryData(['band-follower-count', bandId]);

            queryClient.setQueryData(['is-following-band', bandId], { isFollowing: true });
            queryClient.setQueryData(['band-follower-count', bandId], (old: { count: number } | undefined) => ({
                count: (old?.count ?? 0) + 1
            }));

            return { previousIsFollowing, previousCount };
        },
        onError: (error: Error, _variables, context) => {
            if (context?.previousIsFollowing) {
                queryClient.setQueryData(['is-following-band', bandId], context.previousIsFollowing);
            }
            if (context?.previousCount) {
                queryClient.setQueryData(['band-follower-count', bandId], context.previousCount);
            }
            toast.error(error.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['is-following-band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['band-follower-count', bandId] });
        }
    });
};

export const useUnfollowBand = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await unfollowBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to unfollow band');
            }
            return result.body;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['is-following-band', bandId] });
            await queryClient.cancelQueries({ queryKey: ['band-follower-count', bandId] });

            const previousIsFollowing = queryClient.getQueryData(['is-following-band', bandId]);
            const previousCount = queryClient.getQueryData(['band-follower-count', bandId]);

            queryClient.setQueryData(['is-following-band', bandId], { isFollowing: false });
            queryClient.setQueryData(['band-follower-count', bandId], (old: { count: number } | undefined) => ({
                count: Math.max((old?.count ?? 1) - 1, 0)
            }));

            return { previousIsFollowing, previousCount };
        },
        onError: (error: Error, _variables, context) => {
            if (context?.previousIsFollowing) {
                queryClient.setQueryData(['is-following-band', bandId], context.previousIsFollowing);
            }
            if (context?.previousCount) {
                queryClient.setQueryData(['band-follower-count', bandId], context.previousCount);
            }
            toast.error(error.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['is-following-band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['band-follower-count', bandId] });
        }
    });
};

export const useBandFollowers = (bandId: number) => {
    return useQuery({
        queryKey: ['band-followers', bandId],
        queryFn: async () => {
            const result = await getBandFollowers({ data: { bandId, page: 1, limit: 50 } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load followers');
            }
            return result.body;
        },
        staleTime: 1 * 60 * 1000
    });
};

export const useBandFollowerCount = (bandId: number) => {
    return useQuery({
        queryKey: ['band-follower-count', bandId],
        queryFn: async () => {
            const result = await getBandFollowerCount({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load follower count');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useIsFollowingBand = (bandId: number) => {
    return useQuery({
        queryKey: ['is-following-band', bandId],
        queryFn: async () => {
            const result = await getIsFollowingBand({ data: { bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to check following status');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useUpdateBandProfileImage = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profileImageUrl: string) => {
            const result = await updateBandProfileImage({ data: { bandId, profileImageUrl } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update band profile image');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
            toast.success('Profile image updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateBandBackgroundImage = (bandId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (backgroundImageUrl: string) => {
            const result = await updateBandBackgroundImage({ data: { bandId, backgroundImageUrl } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update band background image');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['user-bands'] });
            toast.success('Background image updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};
