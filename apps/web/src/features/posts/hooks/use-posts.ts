import { UserDTO, FeedItem } from '@/common/types/models';
import { type User, type PostReaction } from '@/common/types/drizzle';
import { queryOptions, useQuery, useSuspenseQuery, infiniteQueryOptions, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getFeedPaginated, getReactions, getPost, likePost, unlikePost, updatePost, deletePost } from '../server-functions/posts';
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
            const result = isLiked ? await unlikePost({ data: { postId } }) : await likePost({ data: { postId } });

            if (!result.success) {
                throw new Error('Failed to update like status');
            }

            return result;
        },
        onMutate: async (isLiked: boolean) => {
            await queryClient.cancelQueries({ queryKey: ['feed-infinite'] });
            await queryClient.cancelQueries({ queryKey: ['band-posts'] });
            await queryClient.cancelQueries({ queryKey: ['post', postId] });

            const previousFeedData = queryClient.getQueryData(['feed-infinite']);

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

            queryClient.setQueriesData({ queryKey: ['band-posts'] }, (old: { pages: FeedItem[][]; pageParams: number[] } | undefined) => {
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

            queryClient.setQueryData(['post', postId], (old: FeedItem | null | undefined) => {
                if (!old || !currentUser) return old;

                if (isLiked) {
                    return {
                        ...old,
                        reactions: old.reactions.filter((reaction) => reaction.userId !== currentUser.id)
                    };
                } else {
                    const newReaction: PostReaction = {
                        id: Date.now(),
                        userId: currentUser.id,
                        postId,
                        createdAt: new Date().toISOString()
                    };
                    return {
                        ...old,
                        reactions: [...old.reactions, newReaction]
                    };
                }
            });

            return { previousFeedData };
        },
        onError: (error, _variables, context) => {
            console.error('Like mutation error:', error);
            if (context?.previousFeedData) {
                queryClient.setQueryData(['feed-infinite'], context.previousFeedData);
            }
            queryClient.invalidateQueries({ queryKey: ['band-posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            toast.error(`Failed to update like status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
            queryClient.invalidateQueries({ queryKey: ['band-posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
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
            queryClient.invalidateQueries({ queryKey: ['band-posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
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

export const useUpdatePost = (postId: number, isBandPost: boolean) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ content, mediaKeysToKeep, newMediaKeys }: { content: string; mediaKeysToKeep?: string[]; newMediaKeys?: string[] }) => {
            const result = await updatePost({ data: { postId, content, mediaKeysToKeep, newMediaKeys } });

            if (!result.success) {
                throw new Error('Failed to update post');
            }

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            if (isBandPost) {
                queryClient.invalidateQueries({ queryKey: ['band-posts'] });
            }
            toast.success('Post updated successfully');
        },
        onError: (error) => {
            toast.error(`Failed to update post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
};

export const useDeletePost = (postId: number, isBandPost: boolean) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await deletePost({ data: { postId } });

            if (!result.success) {
                throw new Error('Failed to delete post');
            }

            return result;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['feed-infinite'] });
            await queryClient.cancelQueries({ queryKey: ['band-posts'] });

            const previousFeedData = queryClient.getQueryData(['feed-infinite']);

            queryClient.setQueryData(['feed-infinite'], (old: { pages: FeedItem[][]; pageParams: number[] } | undefined) => {
                if (!old) return old;

                return {
                    ...old,
                    pages: old.pages.map((page) => page.filter((item) => item.post.id !== postId))
                };
            });

            queryClient.setQueriesData({ queryKey: ['band-posts'] }, (old: { pages: FeedItem[][]; pageParams: number[] } | undefined) => {
                if (!old) return old;

                return {
                    ...old,
                    pages: old.pages.map((page) => page.filter((item) => item.post.id !== postId))
                };
            });

            return { previousFeedData };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed-infinite'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
            if (isBandPost) {
                queryClient.invalidateQueries({ queryKey: ['band-posts'] });
            }
            toast.success('Post deleted successfully');
        },
        onError: (error, _variables, context) => {
            console.error('Delete mutation error:', error);
            if (context?.previousFeedData) {
                queryClient.setQueryData(['feed-infinite'], context.previousFeedData);
            }
            queryClient.invalidateQueries({ queryKey: ['band-posts'] });
            toast.error(`Failed to delete post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
};
