# NOSHERS — voice community starter

A responsive React/Vite frontend concept with interactive room discovery, room creation, VIP previews, and a demo gift wallet. Includes a separate LiveKit token-server scaffold for real-time voice.

## Important status

This first build is an **interactive frontend starter**, not a production-ready deployed service. Room lists, text chat, gift balances, and VIP plans are demo-only and local to the current browser session. Live voice is not connected until LiveKit credentials are configured and the frontend joins a room. Authentication, durable database storage, payment processing, and production moderation are not implemented yet.

## Requirements

- Node.js 20+
- A LiveKit Cloud project or self-hosted LiveKit server for voice
- A terminal

## Run the frontend

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Run the token server

Install the LiveKit server SDK:

```bash
npm install livekit-server-sdk
```

Copy `.env.example` to `.env` and fill in the credentials from your LiveKit project. Keep `LIVEKIT_API_SECRET` private; never put it in frontend code or commit `.env`.

Then start the API:

```bash
npm run server
```

The health endpoint is `http://localhost:3001/health`. The token endpoint accepts a POST to `/api/livekit/token` with JSON:

```json
{
  "roomName": "late-night",
  "participantName": "Guest"
}
```

It returns a LiveKit JWT and the server URL. The current token endpoint is a development scaffold. Before public deployment, add authentication, rate limits, server-side role authorization, origin restrictions, request validation, and abuse monitoring. Do not allow clients to choose privileged roles.

## Connecting live voice

The client should request a token from the token server and connect using `livekit-client`:

```js
import { Room } from 'livekit-client';

const room = new Room();
await room.connect(livekitUrl, token);
await room.localParticipant.setMicrophoneEnabled(true);
```

Wire room lifecycle, mute/unmute, participant events, reconnect handling, and disconnect cleanup into the room page before claiming live audio is enabled.

## Production roadmap

1. Authentication and profiles (e.g. Supabase Auth).
2. Database for users, rooms, memberships, chat, gifts, and moderation actions.
3. LiveKit room lifecycle, participant roles, and microphone controls.
4. Text chat backed by a database or realtime service.
5. Gifts: server-side coin ledger, idempotent transactions, gift events, and anti-fraud controls.
6. VIP: verified subscriptions and entitlement checks; use the appropriate payment platform rules.
7. Safety: report/block, room moderation, rate limits, age-appropriate policies, privacy controls, and retention policies.
8. Deployment: frontend hosting, secure API hosting, database migrations, monitoring, backups, and mobile packaging.

## Mobile

This responsive web app adapts to mobile screens. For installable iOS/Android apps, a next step is a React Native / Expo client that shares backend APIs and LiveKit rooms. A website packaged in a WebView alone is not a substitute for testing microphone permissions, audio interruptions, background behavior, and store policies on actual devices.
