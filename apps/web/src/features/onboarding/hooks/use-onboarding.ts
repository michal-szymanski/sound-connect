import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getOnboardingStatus, updateOnboardingProgress, completeOnboarding, skipOnboarding } from '../server-functions/onboarding';

export const useOnboardingStatus = () => {
    return useQuery({
        queryKey: ['onboarding-status'],
        queryFn: async () => {
            const result = await getOnboardingStatus();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to load onboarding status');
            }
            return result.body;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useUpdateOnboardingProgress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (step: number) => {
            const result = await updateOnboardingProgress({ data: { step } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to update progress');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useCompleteOnboarding = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await completeOnboarding();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to complete onboarding');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
            toast.success('Profile setup complete!');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};

export const useSkipOnboarding = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await skipOnboarding();
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to skip onboarding');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
};
