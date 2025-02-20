'use client';

import FeedCard from '@/components/feed-card';
import { useFeed } from '@/lib/react-query';

const Page = () => {
    const { data: feed } = useFeed();

    if (!feed) return null;

    return (
        <div className="container mx-auto flex flex-col items-center gap-5 px-52 pb-10 pt-20">
            {feed.map((post, i) => (
                <FeedCard key={post.id} post={post} isFollowing={i % 2 === 0} />
            ))}
        </div>
    );
};

export default Page;
