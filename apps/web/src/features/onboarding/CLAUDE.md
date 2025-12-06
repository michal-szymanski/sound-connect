# Onboarding

6-step guided profile setup flow for new users after signup/email verification.

## Key Components

- `OnboardingStep` - Step wrapper with progress indicator
- `step-instrument.tsx` - Select primary instrument (required)
- `step-genre.tsx` - Select primary genre (required)
- `step-location.tsx` - Select city and country with Mapbox autocomplete (required)
- `step-bio.tsx` - Write bio (optional, max 500 chars)
- `step-availability.tsx` - Select availability status (optional)
- `step-profile-photo.tsx` - Upload profile photo (optional)
- `step-username.tsx` - Choose unique username (required)
- `onboarding-profile-image-upload.tsx` - Profile image upload component

## Hooks

- `useOnboardingStatus` - Fetches onboarding status and current step
- `useUpdateOnboardingProgress` - Updates current step progress
- `useCompleteOnboarding` - Marks onboarding complete
- `useSkipOnboarding` - Skips entire onboarding flow

## Server Functions

- `getOnboardingStatus` - Fetches user's onboarding progress (current step, completion status)
- `updateOnboardingProgress` - Updates onboarding step progress (generic function for all steps)
- `completeOnboarding` - Marks onboarding complete and redirects to home
- `skipOnboarding` - Skips onboarding flow

**Note:** Individual step updates (instrument, genre, location, etc.) are handled via the profile server functions in `features/profile/server-functions/profile.ts`, not separate onboarding functions.

## Data Flow

1. User signs up → email verification → redirected to `/onboarding`
2. Backend tracks current step (1-6), completion, and skip status
3. User completes required steps (instrument, genre, location)
4. Optional steps can be skipped individually
5. After step 6 (or skip), onboarding marked complete
6. User redirected to original destination or home page
7. Main app routes check onboarding status and redirect if incomplete
