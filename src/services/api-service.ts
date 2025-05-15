import { postReactionSchema, postSchema } from "src/types";
import { z } from "zod";

export const getFollowings = async (userId: string) => {
  const response = await (
    await fetch(`${process.env.BACKEND_URL}/followings/${userId}`)
  ).json();
  return z.array(z.object({ userId: z.string() })).parse(response);
};
