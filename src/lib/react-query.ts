import { queryOptions, useQuery } from "@tanstack/react-query";
import { Session, User } from "@/types";
import { getFeed, getReactions } from "@/server-functions/models";
import { getSession } from "@/server-functions/auth";

export const useReactions = ({ postId }: { postId: number }) =>
  useQuery({
    queryKey: ["reactions", postId],
    queryFn: async () => await getReactions({ data: { postId } }),
  });

export const feedQueryOptions = () =>
  queryOptions({
    queryKey: ["feed"],
    queryFn: async () => await getFeed(),
  });

export const userQueryOptions = (currentSession?: {
  session: Session;
  user: User;
}) =>
  queryOptions({
    queryKey: ["user"],
    queryFn: async () => {
      const data = currentSession ?? (await getSession());
      return data?.user;
    },
  });
