import { getFeed, getReactions } from "src/services/api-service";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSession } from "@/server-functions";
import { Session } from "@/types";

export const useReactions = ({ postId }: { postId: number }) =>
  useQuery({
    queryKey: ["reactions", postId],
    queryFn: async () => await getReactions(postId),
  });

export const feedQueryOptions = () =>
  queryOptions({
    queryKey: ["feed"],
    queryFn: async () => await getFeed(),
  });

export const userQueryOptions = (session?: Session) =>
  queryOptions({
    queryKey: ["user"],
    queryFn: async () => {
      const data = session ?? (await getSession());
      return data?.user;
    },
  });
