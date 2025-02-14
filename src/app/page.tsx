'use client';

import FeedCard from '@/components/feed-card';
import { useFeed } from '@/lib/react-query';
import { useUser } from '@clerk/nextjs';

const Page = () => {
    const { data: feed } = useFeed();
    const { user } = useUser();

    if (!feed) return null;

    console.log(user);
    return (
        <div className="container mx-auto flex flex-col items-center gap-5 px-52 pb-10 pt-20">
            {feed.map((post, i) => (
                <FeedCard key={post.id} post={post} isFollowing={i % 2 === 0} />
            ))}
        </div>
    );
};

export default Page;
