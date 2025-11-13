type Props = {
    timestamp: number;
};

export function DateDivider({ timestamp }: Props) {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
        <div className="flex justify-center py-4">
            <span className="text-muted-foreground text-xs">{formattedDate}</span>
        </div>
    );
}
