import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getProfile,
    updateInstruments,
    updateGenres,
    updateAvailability,
    updateExperience,
    updateLogistics,
    updateLookingFor,
    updateBio,
    completeSetup
} from '@/features/profile/server-functions/profile';
import type {
    UpdateInstruments,
    UpdateGenres,
    UpdateAvailability,
    UpdateExperience,
    UpdateLogistics,
    UpdateLookingFor,
    UpdateBio,
    CompleteSetup
} from '@sound-connect/common/types/profile';

export const useProfile = (userId: string) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            const result = await getProfile({ data: { userId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load profile');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useUpdateInstruments = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateInstruments) => {
            const result = await updateInstruments({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update instruments');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Instruments updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateGenres = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateGenres) => {
            const result = await updateGenres({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update genres');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Genres updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateAvailability = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateAvailability) => {
            const result = await updateAvailability({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update availability');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Availability updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateExperience = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateExperience) => {
            const result = await updateExperience({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update experience');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Experience updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateLogistics = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateLogistics) => {
            const result = await updateLogistics({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update logistics');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Logistics updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateLookingFor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateLookingFor) => {
            const result = await updateLookingFor({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update looking for');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Looking for updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useUpdateBio = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateBio) => {
            const result = await updateBio({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update bio');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Bio updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useCompleteSetup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CompleteSetup) => {
            const result = await completeSetup({ data });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to complete setup');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile setup completed');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};
