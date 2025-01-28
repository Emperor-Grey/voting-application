# Polling Application with WebAuthn Authentication

A secure polling application built with Rust (backend) and Next.js (frontend) that uses WebAuthn for passwordless authentication.

*NOTE*: The postman docs for the passkey authentication is present at the [Postman Docs](https://work22-1548.postman.co/workspace/1f8130b4-6f2e-43b5-822c-9a93df8e4788/collection/28107246-ba693a87-e9e1-4c35-a953-1c9e7fa06f13?origin=tab-menu)

## Features

- Passwordless authentication using WebAuthn/Passkeys
- Real-time poll updates via WebSocket connections
- Create and vote on polls
- Responsive frontend built with Next.js and Tailwind CSS
- RESTful API built with Axum framework

## Tech Stack

### Backend (Rust)
- **Web Framework**: [Axum](https://github.com/tokio-rs/axum)
- **WebSocket**: tokio-tungstenite
- **Authentication**: [WebAuthn-rs](https://github.com/kanidm/webauthn-rs)
- **Session Management**: tower-sessions
- **Async Runtime**: [Tokio](https://tokio.rs)
- **Logging**: tracing & tracing-subscriber

### Frontend (Next.js)
- **Framework**: Next.js 13+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts
- **WebAuthn Client**: @simplewebauthn/browser

## Project Structure

```
---------------------------------------------------------------------------------------------------

├── src/
│   ├── handlers/        # Request handlers
│   ├── models/          # Data models
│   ├── config.rs        # Configuration
│   ├── error.rs         # Error handling
│   ├── lib.rs           # Imports
|   ├── routes.rs        # Routes for all the stuff 
|   ├── state.rs         # Application state (something that i pass all the time) 
|   ├── wesocet.rs       # Websocket's stuff for voting... 

---------------------------------------------------------------------------------------------------
│
└── polling-frontend/    # Next.js frontend application
    ├── app/            # Next.js app directory
    ├── components/     # React components
    ├── lib/           # Utility functions
    └── types/         # TypeScript types
    ... so on i am lazy to type as i manually types this things (TLDR: it's too damn big cuz shadcn)
    
---------------------------------------------------------------------------------------------------

```

## Getting Started

### Prerequisites
- Rust 1.70+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Clone the repository
2. Create a `.env` file in the root directory(check .env.example) with:
```env
RP_ID=localhost
RP_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

3. Run the backend server:
```bash
cargo run 
```

The server will start on http://localhost:3000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd polling-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a .env file in the polling-frontend directory:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:3003/ws/polls
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at http://localhost:3002

## API Endpoints

- `POST /auth/register/start/:username` - Start registration flow
- `POST /auth/register/finish` - Complete registration
- `POST /auth/login/start/:username` - Start authentication flow
- `POST /auth/login/finish` - Complete authentication
- `POST /api/polls`: Create a new poll.
- `GET /api/polls/[pollId]`: Get poll details (SSR).
- `POST /api/polls/[pollId]/vote`: Cast a vote for a poll option.
