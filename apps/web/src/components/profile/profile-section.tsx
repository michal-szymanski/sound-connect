import { useState, type ReactNode } from 'react';
import { Card } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Pencil } from 'lucide-react';

type Props = {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
    editForm?: (closeForm: () => void) => ReactNode;
    canEdit: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
};

export const ProfileSection = ({ title, icon, children, editForm, canEdit, isEmpty, emptyMessage }: Props) => {
    const [isEditing, setIsEditing] = useState(false);

    if (!canEdit && isEmpty) {
        return null;
    }

    const closeForm = () => setIsEditing(false);

    return (
        <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-lg font-semibold">{title}</h2>
                </div>
                {canEdit && !isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0" aria-label={`Edit ${title}`}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isEditing && editForm ? (
                editForm(closeForm)
            ) : isEmpty ? (
                <p className="text-muted-foreground text-sm">{emptyMessage}</p>
            ) : (
                <div className="space-y-2">{children}</div>
            )}
        </Card>
    );
};
