import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { createBand, getBand, updateBand, deleteBand, addBandMember, removeBandMember, getUserBands } from '@/features/bands/server-functions/bands';
import type { CreateBandInput, UpdateBandInput } from '@sound-connect/common/types/bands';

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
