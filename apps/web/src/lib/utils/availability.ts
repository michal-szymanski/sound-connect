import type { AvailabilityStatus } from '@sound-connect/common/types/profile-enums';

export type AvailabilityStatusColor = {
    badge: 'default' | 'secondary' | 'destructive' | 'outline';
    dot: string;
    label: string;
};

export const availabilityStatusConfig: Record<AvailabilityStatus, AvailabilityStatusColor> = {
    actively_looking: {
        badge: 'default',
        dot: 'bg-green-500',
        label: 'Actively Looking'
    },
    open_to_offers: {
        badge: 'secondary',
        dot: 'bg-blue-500',
        label: 'Open to Offers'
    },
    not_looking: {
        badge: 'outline',
        dot: 'bg-gray-500',
        label: 'Not Looking'
    },
    just_browsing: {
        badge: 'outline',
        dot: 'bg-yellow-500',
        label: 'Just Browsing'
    }
};

export function getAvailabilityStatusColor(status: AvailabilityStatus | null): AvailabilityStatusColor {
    if (!status) {
        return availabilityStatusConfig.just_browsing;
    }
    return availabilityStatusConfig[status];
}

export function getAvailabilityStatusLabel(status: AvailabilityStatus | null): string {
    return getAvailabilityStatusColor(status).label;
}
