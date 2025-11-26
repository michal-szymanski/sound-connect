import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';

const DefaultCatchBoundary = ({ error }: ErrorComponentProps) => {
    const router = useRouter();
    const isRoot = useMatch({
        strict: false,
        select: (state) => state.id === rootRouteId
    });

    return (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
            <ErrorComponent error={error} />
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => {
                        router.invalidate();
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                >
                    Try Again
                </button>
                {isRoot ? (
                    <Link to="/" className="bg-card text-card-foreground hover:bg-accent rounded-lg border px-4 py-2 text-sm font-semibold transition-colors">
                        Home
                    </Link>
                ) : (
                    <Link
                        to="/"
                        className="bg-card text-card-foreground hover:bg-accent rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
                        onClick={(e) => {
                            e.preventDefault();
                            window.history.back();
                        }}
                    >
                        Go Back
                    </Link>
                )}
            </div>
        </div>
    );
};

export default DefaultCatchBoundary;
