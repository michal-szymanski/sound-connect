import AccountButton from '@/components/account-button';
import ThemeToggle from '@/components/theme-toggle';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { UserDTO, userDTOSchema } from '@/types';
import { currentUser } from '@clerk/nextjs/server';
import { House } from 'lucide-react';
import Link from 'next/link';

const Header = async () => {
    const user = await currentUser();

    let userDTO: UserDTO | null = null;

    if (user) {
        userDTO = userDTOSchema.parse({
            id: user.id,
            imageUrl: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName
        });
    }

    return (
        <header className="border-grid fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-[1200px] items-center px-10">
                <NavigationMenu className="flex w-full max-w-full flex-1 items-center justify-between gap-2">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <Link href="/" legacyBehavior passHref>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                    <House className="size-[1.2rem]" />
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                    <NavigationMenuList className="gap-5">
                        <NavigationMenuItem>
                            <ThemeToggle />
                        </NavigationMenuItem>
                        <NavigationMenuItem>{userDTO && <AccountButton userDTO={userDTO} />}</NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </header>
    );
};

export default Header;
