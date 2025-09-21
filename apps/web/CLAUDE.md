# Frontend Application

This is the frontend part of the Sound Connect social media application for musicians.

## Technology Stack
- **Framework**: Tanstack Start (95% Tanstack Router + extras) - currently in beta
- **UI Components**: ShadCN and TailwindCSS
- **Hosting**: Cloudflare Worker

## Project Structure
- `src/components/ui/` - ShadCN components (DO NOT MODIFY - auto-generated)
- `src/components/` - Custom components organized in folders
- `src/server-functions/` - Communication with backend API, results wrapped in envelopes for consistency
- `src/types/` - Frontend-specific types

## Frontend-Specific Rules
- Never modify files in `src/components/ui` directory - these are ShadCN generated files
- Avoid using querySelector - use refs instead
- Avoid using FC<T> interface when implementing React components