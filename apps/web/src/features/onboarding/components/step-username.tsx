import { useState, useEffect, useRef } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Loader2, CheckCircle2, AlertCircle, AtSign } from 'lucide-react';
import { usernameSchema } from '@sound-connect/common/types/settings';
import { useCheckUsernameAvailability } from '@/features/settings/hooks/use-settings';

type Props = {
    value: string;
    onChange: (value: string) => void;
};

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'taken';

export const StepUsername = ({ value, onChange }: Props) => {
    const [validationState, setValidationState] = useState<ValidationState>('idle');
    const [error, setError] = useState<string>('');
    const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const { mutateAsync: checkAvailability } = useCheckUsernameAvailability();

    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!value) {
            setValidationState('idle');
            setError('');
            return;
        }

        setValidationState('validating');

        debounceTimerRef.current = setTimeout(async () => {
            const result = usernameSchema.safeParse(value);

            if (!result.success) {
                setValidationState('invalid');
                setError(result.error.issues[0]?.message || 'Invalid username');
                return;
            }

            try {
                const availabilityResult = await checkAvailability({ username: result.data });

                if (availabilityResult.available) {
                    setValidationState('valid');
                    setError('');
                } else {
                    setValidationState('taken');
                    setError('This username is already taken');
                }
            } catch {
                setValidationState('invalid');
                setError('Could not check availability');
            }
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [value, checkAvailability]);

    const getValidationIcon = () => {
        switch (validationState) {
            case 'validating':
                return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
            case 'valid':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'invalid':
            case 'taken':
                return <AlertCircle className="h-5 w-5 text-destructive" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-base">Choose a username</Label>
                <p className="text-muted-foreground text-sm">
                    Optional - you can skip this step.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <AtSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                            type="text"
                            placeholder="username"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className={`pl-9 pr-10 ${
                                validationState === 'invalid' || validationState === 'taken'
                                    ? 'border-destructive focus-visible:ring-destructive'
                                    : validationState === 'valid'
                                      ? 'border-green-500 focus-visible:ring-green-500'
                                      : ''
                            }`}
                            maxLength={30}
                            autoComplete="off"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">{getValidationIcon()}</div>
                    </div>

                    {error && <p className="text-destructive text-sm">{error}</p>}
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-muted-foreground text-xs font-medium">Username requirements:</p>
                    <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
                        <li>• 3-30 characters</li>
                        <li>• Must start with a letter or number</li>
                        <li>• Can contain letters, numbers, underscores, and hyphens</li>
                        <li>• Will be converted to lowercase</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
