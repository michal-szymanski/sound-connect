# Backend API

This is the backend part of the Sound Connect social media application for musicians.

📚 **[← Back to Main Documentation](../../CLAUDE.md)**

## Technology Stack
- **Runtime**: Cloudflare Workers for auth and database access
- **Real-time Communication**: Cloudflare Durable Objects
- **Database**: Drizzle.js ORM connected to Cloudflare D1 database

## Project Structure
- `src/server.ts` - Main application file
- `src/types/` - Backend-specific types
- Database ORM: Drizzle.js with D1

## Backend-Specific Rules
- Use Cloudflare Workers for authentication and database access
- Use Durable Objects for real-time communication between users
- Accessing ID of the current user should be done with `c.get('user')` instead of sending the ID from frontend
- Database column names MUST use snake_case (e.g., `created_at`, `user_id`, `post_id`)