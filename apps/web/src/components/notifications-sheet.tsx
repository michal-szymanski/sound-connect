import { SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, Sheet } from '@/web/components/ui/sheet';

type Props = {
    open: boolean;
    setOpen: (value: boolean) => void;
};

const NotificationsSheet = ({ open, setOpen }: Props) => {
    return (
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
            <SheetContent side="left" className="left-35">
                <SheetHeader>
                    <SheetTitle>Notifications</SheetTitle>
                    <SheetDescription>
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </SheetDescription>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    );
};

export default NotificationsSheet;
