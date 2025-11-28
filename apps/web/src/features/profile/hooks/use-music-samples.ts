import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getMusicSamples,
    createMusicSample,
    updateMusicSample,
    deleteMusicSample,
    reorderMusicSamples
} from '@/features/profile/server-functions/music-samples';
import type { CreateMusicSample, UpdateMusicSample, ReorderMusicSamples } from '@sound-connect/common/types/music-samples';

export const useMusicSamples = (userId: string) => {
    return useQuery({
        queryKey: ['music-samples', userId],
        queryFn: async () => {
            const result = await getMusicSamples({ data: { userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load music samples');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useCreateMusicSample = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateMusicSample) => {
            const result = await createMusicSample({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to create music sample');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['music-samples'] });
            toast.success('Music sample added successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateMusicSample = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: number } & UpdateMusicSample) => {
            const result = await updateMusicSample({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update music sample');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['music-samples'] });
            toast.success('Music sample updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useDeleteMusicSample = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const result = await deleteMusicSample({ data: { id } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to delete music sample');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['music-samples'] });
            toast.success('Music sample deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useReorderMusicSamples = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ReorderMusicSamples) => {
            const result = await reorderMusicSamples({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to reorder music samples');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['music-samples'] });
            toast.success('Music samples reordered successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};
