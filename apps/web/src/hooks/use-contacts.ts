import { useFollowers, useFollowings, useUser } from '@/web/lib/react-query';
import { getUser } from '@/web/server-functions/models';
import { UserDTO } from '@sound-connect/common/types/models';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const useContacts = () => {
    const { data: user } = useUser();
    const { data: followings } = useFollowings(user);
    const { data: followers } = useFollowers(user);
    const queryClient = useQueryClient();
    const [users, setUsers] = useState<UserDTO[]>([]);

    useEffect(() => {
        setUsers([]);
        const commonIds = followings.filter(({ userId }) => followers.some(({ followedUserId }) => userId === followedUserId)).map(({ userId }) => userId);

        for (const userId of commonIds) {
            const queryDataUser = queryClient.getQueryData<UserDTO>(['user', userId]);

            if (queryDataUser) {
                setUsers((prev) => [...prev, queryDataUser]);
                continue;
            }

            getUser({ data: { userId } }).then((result) => {
                if (result.success) {
                    queryClient.setQueryData(['user', userId], result.body);
                    setUsers((prev) => [...prev, result.body]);
                }
            });
        }
    }, [followers, followings, queryClient]);

    return { users };
};

export default useContacts;
