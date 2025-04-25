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
- **Data Storage**: In-memory storage with PostgreSQL support
- **Real-time Updates**: WebSockets

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Application Structure

- **Customer View**: Scan QR code to access bay-specific menu, place and track orders
- **Server View**: Monitor bay status, manage orders, place orders on behalf of customers
- **Kitchen View**: Track and prioritize incoming orders, mark items as prepared

## License

MIT