import { UserDTO } from '@/common/types/models';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFollowers, useFollowings, useUser } from '@/web/lib/react-query';

const useContacts = () => {
    const { data: user } = useUser();
    const { data: followings } = useFollowings(user);
    const { data: followers } = useFollowers(user);
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
