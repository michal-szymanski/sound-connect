import SearchBar from '@/web/components/searchbar';

const Header = () => {
    return (
        <header className="border-grid bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 z-50 w-full overflow-visible border-b backdrop-blur-sm">
            <div className="container mx-auto flex h-14 max-w-[1200px] items-center justify-center overflow-visible px-10">
                <SearchBar />
            </div>
        </header>
    );
};

export default Header;
