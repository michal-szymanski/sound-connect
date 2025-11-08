type Props = {
    current: number;
    max: number;
    className?: string;
};

export const CharacterCounter = ({ current, max, className }: Props) => {
    const isNearLimit = current > max * 0.8;
    const isOverLimit = current > max;

    return (
        <span
            className={`text-sm ${
                isOverLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'
            } ${className || ''}`}
        >
            {current}/{max}
        </span>
    );
};
