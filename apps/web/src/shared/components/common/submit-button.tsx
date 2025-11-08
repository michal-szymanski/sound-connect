import clsx from 'clsx';
import React from 'react';
import Spinner from '@/shared/components/common/spinner';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type Props = React.PropsWithChildren<{
    isSpinner: boolean;
    className?: string;
}>;

const SubmitButton = ({ isSpinner, children, className }: Props) => {
    return (
        <Button type="submit" aria-busy={isSpinner} disabled={isSpinner} className={cn('relative', className)} data-testid="submit-button">
            <div
                role="status"
                aria-live="polite"
                className={clsx('absolute inset-0 flex items-center justify-center', 'transition-opacity duration-200 ease-in-out', {
                    'pointer-events-auto opacity-100': isSpinner,
                    'pointer-events-none opacity-0': !isSpinner
                })}
            >
                <Spinner aria-hidden="true" />
                <span className="sr-only">Please wait...</span>
            </div>
            <div
                className={clsx('absolute inset-0 flex items-center justify-center', 'transition-opacity duration-200 ease-in-out', {
                    'pointer-events-none opacity-0': isSpinner,
                    'opacity-100': !isSpinner
                })}
            >
                {children}
            </div>
        </Button>
    );
};

export default SubmitButton;
