import { useFollowers, useFollowings, useMutualFollowers, useUser } from '@/web/lib/react-query';
import StatusAvatar from '@/web/components/small/status-avatar';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { UserDTO } from '@sound-connect/common/types/models';
import { useQueryClient } from '@tanstack/react-query';
import { getUser } from '@/web/server-functions/models';

const RightSidebar = () => {
    const { data: user } = useUser();
    const { data: followings } = useFollowings(user);
    const { data: followers } = useFollowers(user);
    const queryClient = useQueryClient();
    const [users, setUsers] = useState<UserDTO[]>([]);

    useEffect(() => {
        const commonIds = followings.filter(({ userId }) => followers.some(({ followedUserId }) => userId === followedUserId)).map(({ userId }) => userId);
        setUsers([]);

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

    console.log('Mutual Followers:', users);

    return (
        <div className="bg-background fixed right-0 top-0 z-50 hidden h-full w-64 overflow-y-auto border-l p-4 lg:block">
            <h2 className="mb-4 text-xl font-semibold">Contacts</h2>

            {users.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No mutual followers found</p>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => (
                        <Link
                            key={user.id}
                            to="/chat/$userId"
                            params={{ userId: user.id }}
                            className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <StatusAvatar user={user} />
                            <span className="text-sm font-medium">{user.name}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
export default RightSidebar;
