type ProfileData = {
    city: string | null;
    primaryInstrument: string | null;
    primaryGenre: string | null;
    yearsPlayingPrimary: number | null;
    seekingToPlay: string | null;
    secondaryGenres: string | null;
    influences: string | null;
    status: string | null;
    commitmentLevel: string | null;
    weeklyAvailability: string | null;
    rehearsalFrequency: string | null;
    giggingLevel: string | null;
    pastBands: string | null;
    hasStudioExperience: boolean | null;
    state: string | null;
    country: string | null;
    travelRadius: number | null;
    hasRehearsalSpace: boolean | null;
    hasTransportation: boolean | null;
    seeking: string | null;
    canOffer: string | null;
    dealBreakers: string | null;
    bio: string | null;
    musicalGoals: string | null;
    ageRange: string | null;
};

export const calculateProfileCompletion = (profile: ProfileData): number => {
    let completion = 0;
    const requiredFields = 3;

    if (profile.primaryInstrument) completion++;
    if (profile.primaryGenre) completion++;
    if (profile.city) completion++;

    return Math.round((completion / requiredFields) * 100);
};
