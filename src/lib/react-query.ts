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
    queryFn: async () => {
      const response = await getFeed();

      if (response.success) {
        return response.body;
      }

      return [];
    },
  });

export const userQueryOptions = (
  currentSession: {
    session: Session;
    user: User;
  } | null
) =>
  queryOptions({
    queryKey: ["user"],
    queryFn: async () => {
      if (currentSession) {
        return currentSession.user;
      }

      const response = await getSession();

      if (response.success) {
        return response.body.user;
      }

      return null;
    },
  });
