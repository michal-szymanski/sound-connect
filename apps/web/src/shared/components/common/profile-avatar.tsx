import { Link } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

type ProfileType = 'user' | 'band';

type Props = {
    profile: {
        id: string;
        name: string;
        image: string | null;
        username?: string | null;
    };
    type?: ProfileType;
    className?: string;
    fallbackClassName?: string;
    linkToProfile?: boolean;
};

const ProfileAvatar = ({ profile, type = 'user', className, fallbackClassName, linkToProfile = false }: Props) => {
    const isBand = type === 'band';
    const shape = isBand ? 'rounded-md' : 'rounded-full';

    const avatarContent = (
        <Avatar className={cn('relative top-0', shape, className)}>
            <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
            <AvatarFallback className={cn('bg-muted', shape, fallbackClassName)}>
                {isBand ? <Users className="h-[40%] w-[40%]" /> : profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );

    if (linkToProfile && profile.username) {
        return (
            <Link to="/profile/$username" params={{ username: profile.username }} className="shrink-0">
                {avatarContent}
            </Link>
        );
    }

    return avatarContent;
};

export default ProfileAvatar;
