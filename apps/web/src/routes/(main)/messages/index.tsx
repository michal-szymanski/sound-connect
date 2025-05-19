import useWebsocket from '@/web/hooks/use-websocket';
import { getBindings } from '@/web/lib/cloudflare-bindings';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const [websocket] = useWebsocket();
    return <div>Hello "/messages/"!</div>;
}
