import FeedCard from '@/components/feed-card';
import { getFeed } from '@/services/api-service';

const Page = async () => {
    const feed = await getFeed();
    return (
        <div className="container mx-auto flex flex-col gap-5 px-52 pt-10">
            {feed.map((post, i) => (
                <FeedCard key={post.id} post={post} isFollowing={i % 2 === 0} />
            ))}
        </div>
    );
};

export default Page;
