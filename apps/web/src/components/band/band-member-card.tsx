import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { Badge } from '@/web/components/ui/badge';
import { Button } from '@/web/components/ui/button';
import { Card, CardContent } from '@/web/components/ui/card';
import { Trash2 } from 'lucide-react';
import type { BandMember } from '@sound-connect/common/types/bands';

type Props = {
    member: BandMember;
    canRemove: boolean;
    onRemove: (userId: string) => void;
    isRemoving: boolean;
};

export function BandMemberCard({ member, canRemove, onRemove, isRemoving }: Props) {
    const initials = member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const joinedDate = new Date(member.joinedAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });

    return (
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link to={`/users/${member.userId}` as any} className="flex-shrink-0">
                        <Avatar className="hover:ring-primary h-12 w-12 ring-2 ring-transparent transition-all">
                            <AvatarImage src={member.profileImageUrl || undefined} alt={member.name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <Link to={`/users/${member.userId}` as any} className="group">
                                <h3 className="font-semibold group-hover:underline">{member.name}</h3>
                            </Link>

                            {member.isAdmin && (
                                <Badge variant="secondary" className="whitespace-nowrap">
                                    Admin
                                </Badge>
                            )}
                        </div>

                        <p className="text-muted-foreground text-sm">Member since {joinedDate}</p>

                        {canRemove && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(member.userId)}
                                disabled={isRemoving}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive mt-2 -ml-2"
                                aria-label={`Remove ${member.name} from band`}
                            >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Remove
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
