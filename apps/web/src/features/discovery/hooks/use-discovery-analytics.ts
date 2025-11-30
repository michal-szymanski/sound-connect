import { useState, useEffect, useCallback } from 'react';
import type { DiscoveryAnalyticsEvent, MatchReason } from '@sound-connect/common/types/band-discovery';
import { trackDiscoveryAnalytics } from '../server-functions/band-discovery';

export function useDiscoveryAnalytics() {
    const [sessionId] = useState(() => crypto.randomUUID());

    useEffect(() => {
        trackPageView();
    }, [trackPageView]);

    const trackPageView = useCallback(() => {
        const event: DiscoveryAnalyticsEvent = {
            sessionId,
            eventType: 'page_view'
        };

        trackDiscoveryAnalytics({ data: event }).catch(() => {});
    }, [sessionId]);

    const trackCardClick = useCallback(
        (bandId: number, matchScore: number, matchReasons: MatchReason[], positionInFeed: number) => {
            const event: DiscoveryAnalyticsEvent = {
                sessionId,
                eventType: 'card_click',
                bandId,
                matchScore,
                matchReasons,
                positionInFeed
            };

            trackDiscoveryAnalytics({ data: event }).catch(() => {});
        },
        [sessionId]
    );

    const trackPagination = useCallback(
        (pageNumber: number) => {
            const event: DiscoveryAnalyticsEvent = {
                sessionId,
                eventType: 'pagination',
                pageNumber
            };

            trackDiscoveryAnalytics({ data: event }).catch(() => {});
        },
        [sessionId]
    );

    return {
        trackCardClick,
        trackPagination
    };
}
