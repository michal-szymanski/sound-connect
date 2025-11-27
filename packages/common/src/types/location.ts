import { z } from 'zod';

export const locationSuggestionSchema = z.object({
    mapboxId: z.string(),
    displayName: z.string(),
    city: z.string(),
    state: z.string().nullable(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number()
});

export type LocationSuggestion = z.infer<typeof locationSuggestionSchema>;

export const selectedLocationSchema = z.object({
    city: z.string(),
    state: z.string().optional(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number()
});

export type SelectedLocation = z.infer<typeof selectedLocationSchema>;

export const locationAutocompleteRequestSchema = z.object({
    query: z.string().min(2).max(100)
});

export type LocationAutocompleteRequest = z.infer<typeof locationAutocompleteRequestSchema>;

export const locationAutocompleteResponseSchema = z.object({
    suggestions: z.array(locationSuggestionSchema)
});

export type LocationAutocompleteResponse = z.infer<typeof locationAutocompleteResponseSchema>;
