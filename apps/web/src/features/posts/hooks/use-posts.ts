import { UserDTO, FeedItem } from '@/common/types/models';
import { type User, type PostReaction } from '@/common/types/drizzle';
import { queryOptions, useQuery, useSuspenseQuery, infiniteQueryOptions, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getFeedPaginated, getReactions, getPost, likePost, unlikePost } from '../server-functions/posts';
import { getComments, createComment, likeComment, unlikeComment } from '../server-functions/comments';

export const useReactions = ({ postId }: { postId: number }) =>
    useQuery({
        queryKey: ['reactions', postId],
        queryFn: async () => {
            const result = await getReactions({ data: { postId } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const feedQuery = () =>
    infiniteQueryOptions({
        queryKey: ['feed-infinite'],
        queryFn: async ({ pageParam }) => {
            const result = await getFeedPaginated({ data: { limit: 10, offset: pageParam } });

            if (result.success) {
                return result.body;
            }

            return [];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 10) {
                return undefined;
            }
            return allPages.length * 10;
        }
    });

export const useFeed = () => useInfiniteQuery(feedQuery());

export const postQuery = (postId: number) =>
    queryOptions({
        queryKey: ['post', postId],
        queryFn: async () => {
            const result = await getPost({ data: { postId } });

            if (result.success) {
                return result.body;
            }

            return null;
        }
    });

export const usePost = (postId: number) => useSuspenseQuery(postQuery(postId));

export const useLikeToggle = (postId: number, currentUser: User | UserDTO | null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (isLiked: boolean) => {
            if (isLiked) {
                return await unlikePost({ data: { postId } });
            } else {
                return await likePost({ data: { postId } });
            }
        },
        onMutate: async (isLiked: boolean) => {
            await queryClient.cancelQueries({ queryKey: ['feed-infinite'] });

            const previousData = queryClient.getQueryData(['feed-infinite']);

            queryClient.setQueryData(['feed-infinite'], (old: { pages: FeedItem[][]; pageParams: number[] } | undefined) => {
                if (!old || !currentUser) return old;

                return {
                    ...old,
                    pages: old.pages.map((page) =>
                        page.map((item) => {
                            if (item.post.id !== postId) return item;

                            if (isLiked) {
                                return {
                                    ...item,
                                    reactions: item.reactions.filter((reaction) => reaction.userId !== currentUser.id)
                                };
                            } else {
                                const newReaction: PostReaction = {
                                    id: Date.now(),
                                    userId: currentUser.id,
                                    postId,
                                    createdAt: new Date().toISOString()
                                };
                                return {
                                    ...item,
                                    reactions: [...item.reactions, newReaction]
                                };
                            }
                        })
                    )
                };
            });

            return { previousData };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['feed-infinite'], context.previousData);
            }
            toast.error('Failed to update like status');
        }
    });
};

export const commentsQuery = (postId: number) =>
    queryOptions({
        queryKey: ['comments', postId],
        queryFn: async () => {
            const result = await getComments({ data: { postId } });

            if (result.success) {
                return result.body;
            }

            return [];
        }
    });

export const useComments = (postId: number, enabled: boolean = true) =>
    useQuery({
        ...commentsQuery(postId),
        enabled
    });

export const useCreateComment = (postId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: number | null }) => {
            return await createComment({ data: { postId, content, parentCommentId } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
        },
        onError: () => {
            toast.error('Failed to create comment');
        }
    });
};

export const useCommentLikeToggle = (commentId: number, postId: number, _currentUser: User | UserDTO | null) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (isLiked: boolean) => {
            if (isLiked) {
                return await unlikeComment({ data: { commentId } });
            } else {
                return await likeComment({ data: { commentId } });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        },
        onError: () => {
            toast.error('Failed to update comment like status');
        }
    });
};
