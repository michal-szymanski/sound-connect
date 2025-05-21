import { useMutualFollowers, userQueryOptions } from '@/web/lib/react-query';
import { useWebSocket } from '@/web/providers/websocket-provider';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/(main)/messages/')({
    component: RouteComponent
});

function RouteComponent() {
    const { send, lastMessage, status } = useWebSocket();
    const { data: user } = useSuspenseQuery(userQueryOptions(null));
    const { data: users } = useMutualFollowers(user);

    useEffect(() => {
        if (status === 'open') {
        }
    }, [status, send]);

    return (
        <div>
            <p>Connection status: {status}</p>
            <p>Last message: {JSON.stringify(lastMessage)}</p>
            <button onClick={() => send({ type: 'chat', text: 'hello everyone!' })} disabled={status !== 'open'}>
                Send greeting
            </button>
        </div>
    );
}
