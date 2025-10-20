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

## Development

- **Dev Server**: `http://localhost:4000`
- Both `apps/api` and `apps/posts-queue-consumer` run together on this port during development
- The API serves the web app running on `http://localhost:3000`

## AI Rules

- Use Cloudflare Workers for authentication and database access
- Use Durable Objects for real-time communication between users
- Accessing ID of the current user should be done with `c.get('user')` instead of sending the ID from frontend
