import { userSchema } from '@/types';

export const getUserById = async (userId: string) => {
    const response = await (await fetch(`http://0.0.0.0:4000/users/${userId}`)).json();
    return userSchema.parse(response);
};
