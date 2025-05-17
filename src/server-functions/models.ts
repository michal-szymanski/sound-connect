import { getBindings } from "@/lib/cloudflare-bindings";
import { errorHandler } from "@/server-functions/helpers";
import {
  followerSchema,
  followingSchema,
  postReactionSchema,
  postSchema,
} from "@/types/models";
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
    return await errorHandler(response);
  }

  try {
    const json = await response.json();
    const schema = z.array(postSchema);

    return { success: true, body: schema.parse(json) } as const;
  } catch (error) {
    console.error(error);
    return { success: false, body: null } as const;
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
      return await errorHandler(response);
    }

    try {
      const json = await response.json();
      const schema = z.array(postSchema);

      return { success: true, body: schema.parse(json) } as const;
    } catch (error) {
      console.error(error);
      return { success: false, body: null } as const;
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
      return await errorHandler(response);
    }

    try {
      const json = await response.json();
      const schema = z.array(postReactionSchema);

      return { success: true, body: schema.parse(json) } as const;
    } catch (error) {
      console.error(error);
      return { success: false, body: null } as const;
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
      return await errorHandler(response);
    }

    try {
      const json = await response.json();
      const schema = z.array(followerSchema);

      return { success: true, body: schema.parse(json) } as const;
    } catch (error) {
      console.error(error);
      return { success: false, body: null } as const;
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
      return await errorHandler(response);
    }

    try {
      const json = await response.json();
      const schema = z.array(followingSchema);

      return { success: true, body: schema.parse(json) } as const;
    } catch (error) {
      console.error(error);
      return { success: false, body: null } as const;
    }
  });
