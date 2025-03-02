import ThemeToggle from '@/components/theme-toggle';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu';

const Header = async () => {
    return (
        <header className="border-grid fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-[1200px] items-center px-10">
                <NavigationMenu className="flex w-full max-w-full items-center justify-between gap-2">
                    <NavigationMenuList className="gap-5">
                        <NavigationMenuItem>
                            <ThemeToggle />
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </header>
    );
};

export default Header;
