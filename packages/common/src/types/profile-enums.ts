export const InstrumentEnum = [
    'vocals',
    'guitar',
    'bass_guitar',
    'drums',
    'keyboards',
    'piano',
    'violin',
    'cello',
    'banjo',
    'mandolin',
    'ukulele',
    'saxophone',
    'trumpet',
    'trombone',
    'flute',
    'clarinet',
    'harmonica',
    'synth',
    'dj',
    'production',
    'percussion'
] as const;

export const GenreEnum = [
    'rock',
    'pop',
    'jazz',
    'blues',
    'country',
    'folk',
    'metal',
    'punk',
    'hardcore',
    'indie',
    'alternative',
    'progressive_rock',
    'psychedelic',
    'classic_rock',
    'electronic',
    'edm',
    'house',
    'techno',
    'dubstep',
    'hip_hop',
    'rap',
    'rnb',
    'soul',
    'funk',
    'disco',
    'reggae',
    'ska',
    'latin',
    'salsa',
    'bossa_nova',
    'classical',
    'opera',
    'jazz_fusion',
    'bebop',
    'swing',
    'bluegrass',
    'gospel',
    'experimental',
    'ambient',
    'world'
] as const;

export const AvailabilityStatusEnum = ['actively_looking', 'open_to_offers', 'not_looking', 'just_browsing'] as const;

export const CommitmentLevelEnum = ['hobbyist', 'serious_amateur', 'professional'] as const;

export const RehearsalFrequencyEnum = ['1x_per_week', '2-3x_per_week', '4+_per_week', 'flexible'] as const;

export const GiggingLevelEnum = ['beginner', 'local', 'regional', 'touring', 'professional'] as const;

export type Instrument = (typeof InstrumentEnum)[number];
export type Genre = (typeof GenreEnum)[number];
export type AvailabilityStatus = (typeof AvailabilityStatusEnum)[number];
export type CommitmentLevel = (typeof CommitmentLevelEnum)[number];
export type RehearsalFrequency = (typeof RehearsalFrequencyEnum)[number];
export type GiggingLevel = (typeof GiggingLevelEnum)[number];
