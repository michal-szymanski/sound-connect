import useWebSocket from '@/web/hooks/use-websocket';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const [websocket] = useWebSocket();

    if (!websocket) return null;

    return <div>WebSocket connected.</div>;
}
