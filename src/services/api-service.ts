import { userSchema } from '@/types';
import { z } from 'zod';

export const getUserById = async (userId: string) => {
    const response = await (await fetch(`http://0.0.0.0:4000/users/${userId}`)).json();
    return userSchema.parse(response);
};

export const getFollowers = async (userId: string) => {
    const response = await (await fetch(`http://0.0.0.0:4000/followers/${userId}`)).json();
    return z.array(z.object({ followerId: z.number() })).parse(response);
};

export const getFollowings = async (userId: string) => {
    const response = await (await fetch(`http://0.0.0.0:4000/followings/${userId}`)).json();
    return z.array(z.object({ userId: z.number() })).parse(response);
};

export const getPosts = async (userId: string) => {
    const response = await (await fetch(`http://0.0.0.0:4000/posts/${userId}`)).json();
    return z.array(z.object({ id: z.number(), userId: z.number(), content: z.string() })).parse(response);
};
