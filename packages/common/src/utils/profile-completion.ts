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

    const requiredFieldsWeight = 40;
    const optionalSectionWeight = 60 / 7;

    const hasRequiredFields = profile.city && profile.primaryInstrument && profile.primaryGenre;
    if (hasRequiredFields) {
        completion += requiredFieldsWeight;
    }

    const hasInstrumentsSection = profile.yearsPlayingPrimary !== null || profile.seekingToPlay !== null;
    if (hasInstrumentsSection) {
        completion += optionalSectionWeight;
    }

    const hasGenresSection = profile.secondaryGenres !== null || profile.influences !== null;
    if (hasGenresSection) {
        completion += optionalSectionWeight;
    }

    const hasAvailabilitySection =
        profile.status !== null || profile.commitmentLevel !== null || profile.weeklyAvailability !== null || profile.rehearsalFrequency !== null;
    if (hasAvailabilitySection) {
        completion += optionalSectionWeight;
    }

    const hasExperienceSection = profile.giggingLevel !== null || profile.pastBands !== null || profile.hasStudioExperience !== null;
    if (hasExperienceSection) {
        completion += optionalSectionWeight;
    }

    const hasLogisticsSection =
        profile.state !== null ||
        profile.country !== null ||
        profile.travelRadius !== null ||
        profile.hasRehearsalSpace !== null ||
        profile.hasTransportation !== null;
    if (hasLogisticsSection) {
        completion += optionalSectionWeight;
    }

    const hasLookingForSection = profile.seeking !== null || profile.canOffer !== null || profile.dealBreakers !== null;
    if (hasLookingForSection) {
        completion += optionalSectionWeight;
    }

    const hasBioSection = profile.bio !== null || profile.musicalGoals !== null || profile.ageRange !== null;
    if (hasBioSection) {
        completion += optionalSectionWeight;
    }

    return Math.round(completion);
};
