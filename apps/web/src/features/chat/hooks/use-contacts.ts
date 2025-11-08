import { UserDTO } from '@/common/types/models';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFollowers, useFollowings, useAuth } from '@/shared/lib/react-query';

const useContacts = () => {
    const { data: auth } = useAuth();
    const { data: followings } = useFollowings(auth?.user ?? null);
    const { data: followers } = useFollowers(auth?.user ?? null);
    const queryClient = useQueryClient();
    const [users, setUsers] = useState<UserDTO[]>([]);

    useEffect(() => {
        const contacts = followings.filter((following) => followers.some((follower) => following.id === follower.id));

        for (const user of contacts) {
            queryClient.setQueryData(['user', user.id], user);
        }

        setUsers(contacts);
    }, [followers, followings, queryClient]);

    return { users };
};

export default useContacts;
