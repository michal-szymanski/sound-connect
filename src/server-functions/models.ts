import { getBindings } from "@/lib/cloudflare-bindings";
import { handleError } from "@/server-functions/helpers";
import {
  followerSchema,
  followingSchema,
  postReactionSchema,
  postSchema,
} from "@/types";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export const getFeed = createServerFn().handler(async () => {
  const { headers } = getWebRequest()!;
  const { API, API_URL } = await getBindings();

  const response = await API.fetch(`${API_URL}/feed`, {
    headers,
  });

  if (!response.ok) {
    await handleError(response);
    return null;
  }

  try {
    const json = await response.json();
    const schema = z.array(postSchema);

    return schema.parse(json);
  } catch (error) {
    console.error(error);
    return null;
  }
});

export const getPosts = createServerFn()
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest()!;
    const { API, API_URL } = await getBindings();

    const response = await API.fetch(`${API_URL}/posts/${data.userId}`, {
      headers,
    });

    if (!response.ok) {
      await handleError(response);
      return null;
    }

    try {
      const json = await response.json();
      const schema = z.array(postSchema);

      return schema.parse(json);
    } catch (error) {
      console.error(error);
      return null;
    }
  });

export const getReactions = createServerFn()
  .validator((data: { postId: number }) => data)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest()!;
    const { API, API_URL } = await getBindings();

    const response = await API.fetch(
      `${API_URL}/posts/${data.postId}/reactions`,
      {
        headers,
      }
    );

    if (!response.ok) {
      await handleError(response);
      return null;
    }

    try {
      const json = await response.json();
      const schema = z.array(postReactionSchema);

      return schema.parse(json);
    } catch (error) {
      console.error(error);
      return null;
    }
  });

export const getFollowers = createServerFn()
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest()!;
    const { API, API_URL } = await getBindings();

    const response = await API.fetch(`${API_URL}/followers/${data.userId}`, {
      headers,
    });

    if (!response.ok) {
      await handleError(response);
      return null;
    }

    try {
      const json = await response.json();
      const schema = z.array(followerSchema);

      return schema.parse(json);
    } catch (error) {
      console.error(error);
      return null;
    }
  });

export const getFollowings = createServerFn()
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest()!;
    const { API, API_URL } = await getBindings();

    const response = await API.fetch(`${API_URL}/followings/${data.userId}`, {
      headers,
    });

    if (!response.ok) {
      await handleError(response);
      return null;
    }

    try {
      const json = await response.json();
      const schema = z.array(followingSchema);

      return schema.parse(json);
    } catch (error) {
      console.error(error);
      return null;
    }
  });
