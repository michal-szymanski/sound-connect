import SearchBar from '@/shared/components/layout/searchbar';
import ThemeToggle from '@/shared/components/common/theme-toggle';

const Header = () => {
    return (
        <header className="border-grid bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 z-30 w-full overflow-visible border-b backdrop-blur-sm">
            <div className="flex h-14 items-center overflow-visible px-6">
                <div className="flex-1" />
                <SearchBar />
                <div className="flex flex-1 justify-end">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
};

export default Header;
