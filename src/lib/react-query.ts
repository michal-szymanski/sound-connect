import { getFeed, getReactions } from '@/services/api-service';
import { userSchema } from '@/types';
import { QueryClient, defaultShouldDehydrateQuery, isServer, useQuery } from '@tanstack/react-query';

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000
            },
            dehydrate: {
                // include pending queries in dehydration
                shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending'
            }
        }
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
    if (isServer) {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important, so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

export const useUser = ({ userId }: { userId: number }) =>
    useQuery({
        queryKey: ['users', userId],
        queryFn: async () => {
            const url = `http://localhost:4000/users/${userId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const json = await response.json();
            return userSchema.parse(json);
        }
    });

export const useReactions = ({ postId }: { postId: number }) =>
    useQuery({
        queryKey: ['reactions', postId],
        queryFn: async () => await getReactions(postId)
    });

export const useFeed = () =>
    useQuery({
        queryKey: ['feed'],
        queryFn: async () => await getFeed()
    });
