import { postReactionSchema, postSchema } from "src/types";
import { z } from "zod";

export const getFollowers = async (userId: string) => {
  const response = await (
    await fetch(`${process.env.BACKEND_URL}/followers/${userId}`)
  ).json();
  return z.array(z.object({ followerId: z.string() })).parse(response);
};

export const getFollowings = async (userId: string) => {
  const response = await (
    await fetch(`${process.env.BACKEND_URL}/followings/${userId}`)
  ).json();
  return z.array(z.object({ userId: z.string() })).parse(response);
};

export const getPosts = async (userId: string) => {
  const response = await (
    await fetch(`${process.env.BACKEND_URL}/posts/${userId}`)
  ).json();
  return z
    .array(
      z.object({ id: z.number(), userId: z.string(), content: z.string() })
    )
    .parse(response);
};

export const getFeed = async () => {
  const response = await (
    await fetch(`${process.env.BACKEND_URL}/feed`)
  ).json();
  return z.array(postSchema).parse(response);
};

export const getReactions = async (postId: number) => {
  const response = await (
    await fetch(`${process.env.BACKEND_URL}/posts/${postId}/reactions`)
  ).json();
  return z.array(postReactionSchema).parse(response);
};
