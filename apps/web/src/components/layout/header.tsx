import SearchBar from '@/web/components/layout/searchbar';
import { NotificationsButton } from '@/web/components/notifications-button';

const Header = () => {
    return (
        <header className="border-grid bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 z-30 w-full overflow-visible border-b backdrop-blur-sm">
            <div className="flex h-14 items-center justify-center overflow-visible px-6">
                <SearchBar />
                <NotificationsButton />
            </div>
        </header>
    );
};

export default Header;
