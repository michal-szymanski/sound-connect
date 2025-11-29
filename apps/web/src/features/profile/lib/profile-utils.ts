import { InstrumentEnum, GenreEnum, type Instrument, type Genre } from '@sound-connect/common/types/profile-enums';

export const instrumentLabels: Record<(typeof InstrumentEnum)[number], string> = {
    vocals: 'Vocals',
    guitar: 'Guitar',
    bass_guitar: 'Bass Guitar',
    drums: 'Drums',
    keyboards: 'Keyboards',
    piano: 'Piano',
    violin: 'Violin',
    cello: 'Cello',
    banjo: 'Banjo',
    mandolin: 'Mandolin',
    ukulele: 'Ukulele',
    saxophone: 'Saxophone',
    trumpet: 'Trumpet',
    trombone: 'Trombone',
    flute: 'Flute',
    clarinet: 'Clarinet',
    harmonica: 'Harmonica',
    synth: 'Synth',
    dj: 'DJ',
    production: 'Production',
    percussion: 'Percussion'
};

export const genreLabels: Record<(typeof GenreEnum)[number], string> = {
    rock: 'Rock',
    pop: 'Pop',
    jazz: 'Jazz',
    blues: 'Blues',
    country: 'Country',
    folk: 'Folk',
    metal: 'Metal',
    punk: 'Punk',
    hardcore: 'Hardcore',
    indie: 'Indie',
    alternative: 'Alternative',
    progressive_rock: 'Progressive Rock',
    psychedelic: 'Psychedelic',
    classic_rock: 'Classic Rock',
    electronic: 'Electronic',
    edm: 'EDM',
    house: 'House',
    techno: 'Techno',
    dubstep: 'Dubstep',
    hip_hop: 'Hip Hop',
    rap: 'Rap',
    rnb: 'R&B',
    soul: 'Soul',
    funk: 'Funk',
    disco: 'Disco',
    reggae: 'Reggae',
    ska: 'Ska',
    latin: 'Latin',
    salsa: 'Salsa',
    bossa_nova: 'Bossa Nova',
    classical: 'Classical',
    opera: 'Opera',
    jazz_fusion: 'Jazz Fusion',
    bebop: 'Bebop',
    swing: 'Swing',
    bluegrass: 'Bluegrass',
    gospel: 'Gospel',
    experimental: 'Experimental',
    ambient: 'Ambient',
    world: 'World'
};

export const formatInstrument = (instrument: Instrument): string => {
    return instrumentLabels[instrument] || instrument;
};

export const formatGenre = (genre: Genre): string => {
    return genreLabels[genre] || genre;
};

export const getSortedGenres = () => [...GenreEnum].sort((a, b) => formatGenre(a).localeCompare(formatGenre(b)));

export const getSortedInstruments = () => [...InstrumentEnum].sort((a, b) => formatInstrument(a).localeCompare(formatInstrument(b)));
