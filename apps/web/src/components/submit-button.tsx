import React from 'react';
import Spinner from '@/web/components/spinner';
import { Button } from '@/web/components/ui/button';
import clsx from 'clsx';

type Props = React.PropsWithChildren<{
    isSpinner: boolean;
}>;

const SubmitButton = ({ isSpinner, children }: Props) => {
    return (
        <Button type="submit" aria-busy={isSpinner} disabled={isSpinner} className="relative">
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
