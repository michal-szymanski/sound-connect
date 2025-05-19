import { getEnvs } from '@/web/server-functions/utils';
import { useEffect, useRef, useState } from 'react';

const useWebSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        getEnvs().then((res) => {
            if (!res.success) {
                console.error('[App] Failed to fetch envs');
                return;
            }

            const { API_URL } = res.body;

            const ws = new WebSocket(`${API_URL}/ws`);

            ws.onopen = (e) => {
                console.log('WebSocket connected.', e);
                ws.send('message');
            };

            ws.onclose = (e) => {
                console.log('WebSocket disconnected.', e);
            };

            ws.onerror = (e) => {
                console.error(e);
            };

            ws.onmessage = (e) => {
                console.log(e);
            };
            wsRef.current = ws;
        });

        return () => {
            if (!wsRef.current) return;

            wsRef.current.close();
        };
    }, []);

    return [wsRef.current];
};

export default useWebSocket;
