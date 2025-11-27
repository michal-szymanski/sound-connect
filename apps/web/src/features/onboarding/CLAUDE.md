# Onboarding

6-step guided profile setup flow for new users after signup/email verification.

## Key Components
- `OnboardingStep` - Step wrapper with progress indicator
- `StepInstrument` - Select primary instrument (required)
- `StepGenre` - Select primary genre (required)
- `StepLocation` - Select city and country with Mapbox autocomplete (required)
- `StepBio` - Write bio (optional, max 500 chars)
- `StepAvailability` - Select availability status (optional)
- `StepPhoto` - Upload profile photo (optional)

## Hooks
- `useOnboarding` - Fetches onboarding status and current step
- `useUpdateOnboardingStep` - Updates current step
- `useCompleteOnboarding` - Marks onboarding complete
- `useSkipOnboarding` - Skips entire onboarding flow

## Server Functions
- `getOnboardingStatus` - Fetches user's onboarding progress
- `updateInstrument` - Saves primary instrument
- `updateGenre` - Saves primary genre
- `updateLocation` - Saves city, country, coordinates
- `updateBio` - Saves bio text
- `updateAvailabilityStatus` - Saves availability status
- `updateProfilePhoto` - Uploads and saves profile photo
- `completeOnboarding` - Marks onboarding complete
- `skipOnboarding` - Skips onboarding flow

## Data Flow
1. User signs up → email verification → redirected to `/onboarding`
2. Backend tracks current step (1-6), completion, and skip status
3. User completes required steps (instrument, genre, location)
4. Optional steps can be skipped individually
5. After step 6 (or skip), onboarding marked complete
6. User redirected to original destination or home page
7. Main app routes check onboarding status and redirect if incomplete
