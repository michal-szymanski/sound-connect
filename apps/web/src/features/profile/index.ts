export { AvailabilitySection } from './components/availability-section';
export { BioSection } from './components/bio-section';
export { CharacterCounter } from './components/character-counter';
export { ExperienceSection } from './components/experience-section';
export { GenresSection } from './components/genres-section';
export { InstrumentsSection } from './components/instruments-section';
export { LogisticsSection } from './components/logistics-section';
export { LookingForSection } from './components/looking-for-section';
export { ProfileCompletionBadge } from './components/profile-completion-badge';
export { ProfileCompletionBanner } from './components/profile-completion-banner';
export { ProfileSection } from './components/profile-section';
export { ProfileSkeleton } from './components/profile-skeleton';

export { useProfile } from './hooks/use-profile';

export {
    getProfile,
    updateInstruments,
    updateGenres,
    updateAvailability,
    updateExperience,
    updateLogistics,
    updateLookingFor,
    updateBio,
    completeSetup
} from './server-functions/profile';

export { instrumentLabels, genreLabels, formatInstrument, formatGenre } from './lib/profile-utils';
