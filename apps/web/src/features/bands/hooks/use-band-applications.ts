import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    submitBandApplication,
    getBandApplications,
    acceptBandApplication,
    rejectBandApplication,
    getUserApplicationStatus
} from '@/features/bands/server-functions/band-applications';
import type { CreateBandApplicationInput, RejectBandApplicationInput } from '@sound-connect/common/types/band-applications';

export function useSubmitBandApplication(bandId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBandApplicationInput) => {
            const result = await submitBandApplication({ data: { ...data, bandId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to submit application');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            queryClient.invalidateQueries({ queryKey: ['band-applications', bandId] });
            queryClient.invalidateQueries({ queryKey: ['user-application-status', bandId] });
            toast.success('Application sent!', {
                description: 'The band admins will review it soon.'
            });
        },
        onError: (error: Error) => {
            toast.error('Failed to submit application', {
                description: error.message
            });
        }
    });
}

export function useBandApplications(bandId: number, status: 'pending' | 'accepted' | 'rejected' = 'pending') {
    return useQuery({
        queryKey: ['band-applications', bandId, status],
        queryFn: async () => {
            const result = await getBandApplications({ data: { bandId, status, limit: 100 } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to fetch applications');
            }
            return result.body;
        },
        staleTime: 30 * 1000
    });
}

export function useAcceptBandApplication(bandId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (applicationId: number) => {
            const result = await acceptBandApplication({ data: { bandId, applicationId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to accept application');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band-applications', bandId] });
            queryClient.invalidateQueries({ queryKey: ['band', bandId] });
            toast.success('Application accepted', {
                description: 'Member added to band'
            });
        },
        onError: (error: Error) => {
            toast.error('Failed to accept application', {
                description: error.message
            });
        }
    });
}

export function useRejectBandApplication(bandId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RejectBandApplicationInput & { applicationId: number }) => {
            const { applicationId, ...rejectData } = data;
            const result = await rejectBandApplication({ data: { ...rejectData, bandId, applicationId } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to reject application');
            }
            return result.body;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['band-applications', bandId] });
            toast.success('Application rejected', {
                description: 'The applicant has been notified'
            });
        },
        onError: (error: Error) => {
            toast.error('Failed to reject application', {
                description: error.message
            });
        }
    });
}

export function useUserApplicationStatus(bandId: number) {
    return useQuery({
        queryKey: ['user-application-status', bandId],
        queryFn: async () => {
            const result = await getUserApplicationStatus({ data: { bandId } });
            if (!result.success) {
                return { hasApplied: false, isRejected: false };
            }
            return result.body;
        },
        staleTime: 10 * 1000
    });
}
