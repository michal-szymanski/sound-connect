import FeedCard from "src/components/feed-card";
import { feedQueryOptions, userQueryOptions } from "src/lib/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

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

export const Route = createFileRoute("/(main)/")({
  component: Home,
  beforeLoad: async ({ context: { session } }) => {
    if (!session) {
      const path = "/sign-in";
      console.info(`[App] Redirecting to: ${path}`);

      throw redirect({
        to: path,
      });
    }

    return { session };
  },
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      userQueryOptions(context.session)
    );
    const feed = await context.queryClient.ensureQueryData(feedQueryOptions());

    return { user, feed };
  },
});
