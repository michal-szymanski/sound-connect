type IntlSegmenter = {
    segment: (input: string) => Iterable<unknown>;
};

type IntlWithSegmenter = typeof Intl & {
    Segmenter: new (locale: string, options: { granularity: string }) => IntlSegmenter;
};

export function getCharacterCount(str: string): number {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new (Intl as IntlWithSegmenter).Segmenter('en', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(str)).length;
    }

    return [...str].length;
}
