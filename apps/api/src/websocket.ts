import { DurableObject } from 'cloudflare:workers';

export class WebSocketServer extends DurableObject {
    constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
        // This is reset whenever the constructor runs because
        // regular WebSockets do not survive Durable Object resets.
        //
        // WebSockets accepted via the Hibernation API can survive
        // a certain type of eviction, but we will not cover that here.
        super(ctx, env);
    }

    async fetch(_request: Request): Promise<Response> {
        // Creates two ends of a WebSocket connection.
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        // Calling `accept()` tells the runtime that this WebSocket is to begin terminating
        // request within the Durable Object. It has the effect of "accepting" the connection,
        // and allowing the WebSocket to send and receive messages.
        server.accept();

        // Upon receiving a message from the client, the server replies with the same message,
        // and the total number of connections with the "[Durable Object]: " prefix
        server.addEventListener('message', (_event: MessageEvent) => {
            server.send(`[Durable Object] currentlyConnectedWebSockets:`);
        });

        // If the client closes the connection, the runtime will close the connection too.
        server.addEventListener('close', (cls: CloseEvent) => {
            server.close(cls.code, 'Durable Object is closing WebSocket');
        });

        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }
}
