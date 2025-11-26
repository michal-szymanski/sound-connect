import { Link } from '@tanstack/react-router';
import { ReactNode } from 'react';

const NotFound = ({ children }: { children?: ReactNode }) => {
    return (
        <div className="space-y-4 p-4">
            <div className="text-muted-foreground">{children || <p>The page you are looking for does not exist.</p>}</div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => window.history.back()}
                    className="bg-card text-card-foreground hover:bg-accent rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
                >
                    Go Back
                </button>
                <Link to="/" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
                    Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
