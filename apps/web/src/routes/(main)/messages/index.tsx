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
    // this component is for social media messages module (chat). Generate UI for chat messanger using Shadcn UI. User = current user and users = list of people I can chat with. Use react-query to fetch the data and use react-router to create the route. Use useWebSocket to send and receive messages. Use useEffect to handle the connection status and send a message when the connection is open.
    // useEffect(() => {
    //     if (status === 'open') {
    //     }
    // }, [status, send]);

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
