import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { getFollowers, getFollowings, getPosts, getUserById } from '@/services/api-service';
import { User } from '@/types';

const Page = async ({ params }: { params: Promise<{ userId: string }> }) => {
    const { userId } = await params;
    let user: User | null = null;

    try {
        user = await getUserById(userId);
    } catch {
        notFound();
    }

    const followers = await getFollowers(userId);
    const followings = await getFollowings(userId);
    const posts = await getPosts(userId);

    return (
        <>
            <div className="container mx-auto px-4">
                <Card className="overflow-hidden">
                    <div className="relative h-60 max-h-60">
                        <Image src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80" alt="Photo by Drew Beamer" fill />
                    </div>
                    <Image
                        src="https://github.com/shadcn.png"
                        alt="Shadcn"
                        className="relative -top-20 left-10 rounded-full object-cover"
                        width={160}
                        height={160}
                    />
                    <div>
                        <h1 className="relative -top-10 left-10 text-xl">
                            {user.firstName} {user.lastName}
                        </h1>
                        <div className="inline-flex w-full justify-end gap-2 p-5 text-muted-foreground">
                            <div>{posts.length} posts</div>
                            <div>{followers.length} followers</div>
                            <div>{followings.length} following</div>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default Page;
