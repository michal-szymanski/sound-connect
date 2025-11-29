import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

type Tab = {
    value: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    badge?: React.ReactNode;
};

type NavigationTabsProps = {
    tabs: Tab[];
    defaultValue: string;
    children: React.ReactNode;
    className?: string;
    urlParam?: string;
};

export function NavigationTabs({ tabs, defaultValue, children, className, urlParam }: NavigationTabsProps) {
    const navigate = useNavigate();
    const search = useSearch({ strict: false });
    const [localValue, setLocalValue] = useState(defaultValue);

    const currentValue = urlParam ? ((search as Record<string, unknown>)[urlParam] as string) || defaultValue : localValue;

    const handleValueChange = (value: string) => {
        if (urlParam) {
            navigate({
                search: (prev: Record<string, unknown>) => ({ ...prev, [urlParam]: value }) as never,
                replace: true
            });
        } else {
            setLocalValue(value);
        }
    };

    return (
        <Tabs value={currentValue} onValueChange={handleValueChange} className={className}>
            <TabsList className="bg-muted/30 h-auto w-full justify-start gap-1 rounded-lg p-1">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground rounded-md px-4 py-2 text-center text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none data-[state=active]:shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                            {tab.badge}
                        </div>
                    </TabsTrigger>
                ))}
            </TabsList>
            {children}
        </Tabs>
    );
}

type NavigationTabsContentProps = {
    value: string;
    children: React.ReactNode;
    className?: string;
};

export function NavigationTabsContent({ value, children, className }: NavigationTabsContentProps) {
    return (
        <TabsContent value={value} className={className}>
            {children}
        </TabsContent>
    );
}
