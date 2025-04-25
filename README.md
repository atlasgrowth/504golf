# SwingEats - Golf Facility Food Ordering System

SwingEats is a comprehensive digital food ordering system designed for golf facilities with multiple bays. It provides a seamless experience for customers, servers, and kitchen staff, streamlining the food ordering and preparation process.

## Features

- **Multi-Interface System**:
  - Customer QR-code based ordering interface
  - Server ordering and management interface
  - Kitchen preparation and order management interface

- **Real-time Updates**: WebSocket integration ensures all interfaces stay in sync with real-time updates

- **Kitchen Management**: Prioritized order display with timing tracking and alerts for delayed orders

- **Bay Management**: Visual tracking of bay status across multiple floors

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Updates**: WebSockets
- **Docker**: For containerized database deployment

## Getting Started

1. Start the database:
   ```bash
   docker compose up -d
   ```
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm i
   ```
4. Set up and seed the database:
   ```bash
   npm run db:push && npm run db:seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Application Structure

- **Customer View**: Scan QR code to access bay-specific menu, place and track orders
- **Server View**: Monitor bay status, manage orders, place orders on behalf of customers
- **Kitchen View**: Track and prioritize incoming orders, mark items as prepared

## License

MIT