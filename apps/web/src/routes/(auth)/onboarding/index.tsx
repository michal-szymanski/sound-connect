import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { StepInstrument } from '@/features/onboarding/components/step-instrument';
import { StepGenre } from '@/features/onboarding/components/step-genre';
import { StepLocation } from '@/features/onboarding/components/step-location';
import { StepBio } from '@/features/onboarding/components/step-bio';
import { StepAvailability } from '@/features/onboarding/components/step-availability';
import { StepProfilePhoto } from '@/features/onboarding/components/step-profile-photo';
import { useUpdateOnboardingProgress, useCompleteOnboarding, useSkipOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { useUpdateInstruments, useUpdateGenres, useUpdateLogistics, useUpdateBio, useUpdateAvailability } from '@/features/profile/hooks/use-profile';
import type { Instrument, Genre, AvailabilityStatus } from '@sound-connect/common/types/profile-enums';

export const Route = createFileRoute('/(auth)/onboarding/')({
    beforeLoad: async ({ context }) => {
        if (!context.user) {
            throw redirect({
                to: '/sign-in',
                search: {
                    redirect: '/onboarding'
                }
            });
        }
    },
    validateSearch: (search: Record<string, unknown>) => ({
        redirect: typeof search['redirect'] === 'string' ? search['redirect'] : undefined
    }),
    component: RouteComponent
});

type OnboardingData = {
    primaryInstrument: Instrument | null;
    primaryGenre: Genre | null;
    location: { city: string; country: string };
    bio: string;
    status: AvailabilityStatus | null;
    profileImageUrl: string | null;
};

function RouteComponent() {
    const navigate = useNavigate();
    const { redirect } = Route.useSearch();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<OnboardingData>({
        primaryInstrument: null,
        primaryGenre: null,
        location: { city: '', country: '' },
        bio: '',
        status: null,
        profileImageUrl: null
    });

    const updateProgressMutation = useUpdateOnboardingProgress();
    const completeOnboardingMutation = useCompleteOnboarding();
    const skipOnboardingMutation = useSkipOnboarding();

    const updateInstrumentsMutation = useUpdateInstruments();
    const updateGenresMutation = useUpdateGenres();
    const updateLogisticsMutation = useUpdateLogistics();
    const updateBioMutation = useUpdateBio();
    const updateAvailabilityMutation = useUpdateAvailability();

    const totalSteps = 6;
    const progressPercentage = currentStep === 0 || currentStep === 7 ? 0 : ((currentStep - 1) / totalSteps) * 100;

    const isStep1Valid = formData.primaryInstrument !== null;
    const isStep2Valid = formData.primaryGenre !== null;
    const isStep3Valid = formData.location.city.length > 0 && formData.location.country.length > 0;

    const hasCompletedOnboardingRef = useRef(false);

    useEffect(() => {
        if (currentStep === 7 && !hasCompletedOnboardingRef.current) {
            hasCompletedOnboardingRef.current = true;
            completeOnboardingMutation.mutate(undefined, {
                onSuccess: () => {
                    setTimeout(() => {
                        navigate({ to: redirect || '/' });
                    }, 2000);
                }
            });
        }
    }, [currentStep, completeOnboardingMutation, navigate, redirect]);

    const handleNext = async () => {
        if (currentStep === 0) {
            setCurrentStep(1);
            return;
        }

        if (currentStep >= 1 && currentStep <= 6) {
            let saveSuccess = true;

            if (currentStep === 1 && formData.primaryInstrument) {
                try {
                    await updateInstrumentsMutation.mutateAsync({
                        primaryInstrument: formData.primaryInstrument,
                        yearsPlayingPrimary: 1,
                        additionalInstruments: [],
                        seekingToPlay: []
                    });
                } catch {
                    saveSuccess = false;
                }
            }

            if (currentStep === 2 && formData.primaryGenre) {
                try {
                    await updateGenresMutation.mutateAsync({
                        primaryGenre: formData.primaryGenre,
                        secondaryGenres: [],
                        influences: undefined
                    });
                } catch {
                    saveSuccess = false;
                }
            }

            if (currentStep === 3 && formData.location.city) {
                try {
                    await updateLogisticsMutation.mutateAsync({
                        city: formData.location.city,
                        country: formData.location.country,
                        state: undefined,
                        travelRadius: undefined,
                        hasRehearsalSpace: undefined,
                        hasTransportation: undefined
                    });
                } catch {
                    saveSuccess = false;
                }
            }

            if (currentStep === 4 && formData.bio) {
                try {
                    await updateBioMutation.mutateAsync({
                        bio: formData.bio,
                        musicalGoals: undefined,
                        ageRange: undefined
                    });
                } catch {
                    saveSuccess = false;
                }
            }

            if (currentStep === 5 && formData.status) {
                try {
                    const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
                    await updateAvailabilityMutation.mutateAsync({
                        status: formData.status,
                        statusExpiresAt: formData.status === 'actively_looking' ? new Date(thirtyDaysFromNow).toISOString() : undefined,
                        commitmentLevel: undefined,
                        weeklyAvailability: undefined,
                        rehearsalFrequency: undefined
                    });
                } catch {
                    saveSuccess = false;
                }
            }

            if (!saveSuccess) {
                return;
            }

            updateProgressMutation.mutate(currentStep);
            setCurrentStep(currentStep + 1);
        }
    };

    const handleSkip = () => {
        if (currentStep >= 1 && currentStep <= 6) {
            updateProgressMutation.mutate(currentStep);
            setCurrentStep(currentStep + 1);
        } else if (currentStep === 0) {
            skipOnboardingMutation.mutate(undefined, {
                onSuccess: () => {
                    navigate({ to: redirect || '/' });
                }
            });
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStep = () => {
        if (currentStep === 0) {
            return (
                <div className="space-y-6 text-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Welcome to Sound Connect!</h1>
                        <p className="text-muted-foreground text-lg">Let's set up your musician profile</p>
                    </div>

                    <div className="bg-muted/50 mx-auto max-w-md rounded-lg p-6 text-left">
                        <p className="text-sm">This will only take a few minutes. We'll help you:</p>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                <span>Set your primary instrument and genre</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                <span>Add your location</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                <span>Create your bio</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                <span>Set your availability status</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-primary">✓</span>
                                <span>Upload a profile photo</span>
                            </li>
                        </ul>
                    </div>
                </div>
            );
        }

        if (currentStep === 7) {
            return (
                <div className="space-y-6 text-center">
                    <div className="bg-primary/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="text-primary h-10 w-10"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">All Set!</h1>
                        <p className="text-muted-foreground text-lg">Your profile is ready. Time to discover musicians and bands!</p>
                    </div>

                    <div className="bg-muted/50 mx-auto max-w-md rounded-lg p-6">
                        <p className="text-sm">You can always update your profile later from your settings.</p>
                    </div>
                </div>
            );
        }

        switch (currentStep) {
            case 1:
                return <StepInstrument value={formData.primaryInstrument} onChange={(value) => setFormData({ ...formData, primaryInstrument: value })} />;
            case 2:
                return <StepGenre value={formData.primaryGenre} onChange={(value) => setFormData({ ...formData, primaryGenre: value })} />;
            case 3:
                return <StepLocation value={formData.location} onChange={(value) => setFormData({ ...formData, location: value })} />;
            case 4:
                return <StepBio value={formData.bio} onChange={(value) => setFormData({ ...formData, bio: value })} />;
            case 5:
                return <StepAvailability value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} />;
            case 6:
                return (
                    <StepProfilePhoto
                        currentImageUrl={formData.profileImageUrl}
                        onUploadComplete={(result) => setFormData({ ...formData, profileImageUrl: result.publicUrl })}
                    />
                );
            default:
                return null;
        }
    };

    const isContinueDisabled = () => {
        if (currentStep === 1) return !isStep1Valid || updateInstrumentsMutation.isPending;
        if (currentStep === 2) return !isStep2Valid || updateGenresMutation.isPending;
        if (currentStep === 3) return !isStep3Valid || updateLogisticsMutation.isPending;
        if (currentStep === 4) return updateBioMutation.isPending;
        if (currentStep === 5) return updateAvailabilityMutation.isPending;
        return false;
    };

    const isPending = () => {
        return (
            updateInstrumentsMutation.isPending ||
            updateGenresMutation.isPending ||
            updateLogisticsMutation.isPending ||
            updateBioMutation.isPending ||
            updateAvailabilityMutation.isPending ||
            updateProgressMutation.isPending
        );
    };

    return (
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
            <Card className="w-full max-w-2xl">
                {currentStep > 0 && currentStep < 7 && (
                    <CardHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm font-medium">
                                Step {currentStep} of {totalSteps}
                            </span>
                            <span className="text-muted-foreground text-sm">{Math.round(progressPercentage)}% complete</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </CardHeader>
                )}

                <CardContent className="pt-6">{renderStep()}</CardContent>

                <CardFooter className="flex justify-between gap-4">
                    {currentStep === 0 ? (
                        <>
                            <Button variant="outline" onClick={handleSkip} disabled={skipOnboardingMutation.isPending}>
                                {skipOnboardingMutation.isPending ? 'Skipping...' : 'Skip for now'}
                            </Button>
                            <Button onClick={handleNext} className="group relative overflow-hidden">
                                <span className="relative z-10">Get Started</span>
                                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent motion-safe:group-hover:animate-shimmer-sweep" />
                            </Button>
                        </>
                    ) : currentStep === 7 ? (
                        <Button onClick={() => navigate({ to: redirect || '/' })} className="w-full">
                            Go to Home
                        </Button>
                    ) : (
                        <>
                            <div className="flex gap-2">
                                {currentStep > 1 && (
                                    <Button variant="outline" onClick={handleBack} disabled={isPending()}>
                                        Back
                                    </Button>
                                )}
                                {currentStep >= 1 && currentStep <= 6 && (
                                    <Button variant="ghost" onClick={handleSkip} disabled={isPending()}>
                                        Skip
                                    </Button>
                                )}
                            </div>
                            <Button onClick={handleNext} disabled={isContinueDisabled()} className="group relative overflow-hidden">
                                <span className="relative z-10">{isPending() ? 'Saving...' : currentStep === 6 ? 'Finish' : 'Continue'}</span>
                                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent motion-safe:group-hover:animate-shimmer-sweep" />
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
