import useWebsocket from '@/web/hooks/use-websocket';
import { getBindings } from '@/web/lib/cloudflare-bindings';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent,
    loader: async () => {
        const { API_URL } = await getBindings();
    }
});

function RouteComponent() {
    const { API_URL } = Route.useLoaderData();
    const [websocket] = useWebsocket(API_URL);
    return <div>Hello "/messages/"!</div>;
}
