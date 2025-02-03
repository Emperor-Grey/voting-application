
# Polling Application with WebAuthn Authentication

A secure polling application built with **Rust** (backend) and **Next.js** (frontend) that utilizes **WebAuthn** for passwordless authentication and **real-time updates**.

[![Build And Test](https://github.com/Emperor-Grey/voting-application/actions/workflows/main.yml/badge.svg)](https://github.com/Emperor-Grey/voting-application/actions/workflows/main.yml)

## Features

- **Passwordless authentication** using WebAuthn/Passkeys
- **Real-time poll updates** via WebSocket connections
- Create, manage, and vote on **polls**
- Interactive data visualization with **charts**
- **Responsive design** with dark/light mode support
- **Protected routes** and session management

## Tech Stack

### Backend (Rust)
- **Web Framework**: [Axum](https://github.com/tokio-rs/axum)
- **WebSocket**: tokio-tungstenite
- **Authentication**: [WebAuthn-rs](https://github.com/kanidm/webauthn-rs)
- **Database**: MySQL with SQLx
- **Session Management**: tower-sessions
- **Async Runtime**: [Tokio](https://tokio.rs)
- **Error Handling**: thiserror
- **Logging**: tracing & tracing-subscriber

### Frontend (Next.js)
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS with CSS Variables
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Visualization**: Recharts
- **WebAuthn Client**: @simplewebauthn/browser
- **HTTP Client**: Axios
- **Font**: Geist Sans & Geist Mono

---

## Project Structure

```
---------------------------------------------------------------------------------------------------
├── polling-backend/
│ ├── src/
│ │ ├── handlers/        # Request handlers for auth and polls
│ │ ├── models/          # Data models and database schemas
│ │ ├── config.rs        # Application configuration
│ │ ├── error.rs         # Error handling
│ │ ├── routes.rs        # API route definitions
│ │ ├── state.rs         # Application state management
│ │ └── websocket.rs     # WebSocket implementation
│ └── tests/             # Integration tests
│
└── polling-frontend/
├── app/                 # Next.js app directory
│ ├── components/        # Shared components
│ ├── services/          # WebSocket and API services
│ ├── store/             # Zustand state management
│ ├── polls/             # Poll-related pages
│ └── lib/               # Utility functions
├── components/          # UI components
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── public/              # Static assets
---------------------------------------------------------------------------------------------------
```

---

## Getting Started

### Prerequisites
- Rust 1.70+
- Node.js 18+
- MySQL Database
- npm or yarn

---

### Backend Setup

1. Clone the repository:
    ```bash
    git clone https://github.com/Emperor-Grey/voting-application.git
    ```

2. Create a `.env` file in the root directory with the following configuration:
    ```env
    DATABASE_URL=mysql://user:password@localhost/dbname
    RP_ID=localhost
    RP_ORIGIN=http://localhost:3000
    FRONTEND_URL=http://localhost:3000
    ```

3. Run the backend server:
    ```bash
    cd polling-backend
    cargo run
    ```
   The backend server will start on [http://localhost:3000](http://localhost:3000).

---

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

3. Create a `.env.local` file with:
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

   The frontend will be available at [http://localhost:3002](http://localhost:3002).

---

## API Endpoints

### Authentication
- `POST /auth/register/start/:username` - Start the registration flow
- `POST /auth/register/finish` - Complete registration
- `POST /auth/login/start/:username` - Start authentication flow
- `POST /auth/login/finish` - Complete authentication
- `GET /auth/me` - Get current user

### Polls
- `GET /api/polls` - List all polls
- `POST /api/polls` - Create a new poll
- `GET /api/polls/:id` - Get poll details
- `POST /api/polls/:id/vote` - Cast a vote
- `POST /api/polls/:id/reset` - Reset poll votes
- `POST /api/polls/:id/close` - Close a poll

---

## Docker Support

The application includes Docker configuration for containerized deployment. To build and run the application using Docker, use the following command:

```bash
docker compose up --build
```

---

## License

This project is open-source and available under the MIT license.

For further details on the **WebAuthn** authentication flow, refer to the [Postman Docs](https://work22-1548.postman.co/workspace/1f8130b4-6f2e-43b5-822c-9a93df8e4788/collection/28107246-ba693a87-e9e1-4c35-a953-1c9e7fa06f13?origin=tab-menu).
