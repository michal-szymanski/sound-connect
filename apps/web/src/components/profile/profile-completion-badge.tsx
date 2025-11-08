type Props = {
    completion: number;
    className?: string;
};

export const ProfileCompletionBadge = ({ completion, className }: Props) => {
    const radius = 40;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (completion / 100) * circumference;

    const getColor = () => {
        if (completion >= 67) return '#22c55e';
        if (completion >= 34) return '#eab308';
        return '#ef4444';
    };

    const getTextColor = () => {
        if (completion >= 67) return 'text-green-600 dark:text-green-500';
        if (completion >= 34) return 'text-yellow-600 dark:text-yellow-500';
        return 'text-red-600 dark:text-red-500';
    };

    return (
        <div className={`inline-flex flex-col items-center ${className || ''}`}>
            <div className="relative">
                <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                    <circle
                        stroke="#e5e7eb"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="dark:stroke-gray-700"
                    />
                    <circle
                        stroke={getColor()}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-semibold ${getTextColor()}`}>{completion}%</span>
                </div>
            </div>
            <span className="text-muted-foreground mt-1 text-xs">Profile Complete</span>
        </div>
    );
};
