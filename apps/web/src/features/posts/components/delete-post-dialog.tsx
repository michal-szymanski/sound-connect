import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useDeletePost } from '../hooks/use-posts';
import { useNavigate, useLocation } from '@tanstack/react-router';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    postId: number;
    isBandPost: boolean;
};

export function DeletePostDialog({ open, onOpenChange, postId, isBandPost }: Props) {
    const deleteMutation = useDeletePost(postId, isBandPost);
    const navigate = useNavigate();
    const location = useLocation();

    const isOnPostDetailPage = location.pathname.includes(`/posts/${postId}`);

    const handleDelete = () => {
        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                onOpenChange(false);
                if (isOnPostDetailPage) {
                    navigate({ to: '/' });
                }
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="z-dialog">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Post</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure you want to delete this post? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
