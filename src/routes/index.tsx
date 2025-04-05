import FeedCard from "src/components/feed-card";
import { feedQueryOptions } from "src/lib/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

const Home = () => {
  const { data: feed } = useSuspenseQuery(feedQueryOptions());

  if (!feed) return null;

  return (
    <div className="container mx-auto flex flex-col items-center gap-5 xl:px-52">
      {feed.map((post, i) => (
        <FeedCard key={post.id} post={post} isFollowing={i % 2 === 0} />
      ))}
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context }) => {
    const feed = await context.queryClient.ensureQueryData(feedQueryOptions());

    return { feed };
  },
});
