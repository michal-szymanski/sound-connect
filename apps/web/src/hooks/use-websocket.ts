import { useEffect, useState } from 'react';

const useWebsocket = (url: string) => {
    const [websocket, setWebsocket] = useState<WebSocket>();

    useEffect(() => {
        if (!url) return;

        const ws = new WebSocket(`${url}/ws`);

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

        setWebsocket(ws);

        return () => {
            ws.close();
        };
    }, [url]);

    return [websocket];
};

export default useWebsocket;
