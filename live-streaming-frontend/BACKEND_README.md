# Streamspace backend - implementation guide

**Planned only. No backend server, database schema, OAuth connection, or media relay exists in this repository yet. There are no backend install/run commands to execute.**

## Intended experience

A returning creator can click Go live after stream setup, channel connection, and camera/microphone permission. First-time creators need onboarding and a live-enabled YouTube channel; eligibility, activation, or expired authorization can require extra steps.

The YouTube Live Streaming API (part of YouTube Data API v3) creates and manages broadcasts. It does not transmit browser camera/microphone media. [Official overview](https://developers.google.com/youtube/v3/live/getting-started).

## Architecture

```text
CONTROL: React studio -> authenticated API -> YouTube Live Streaming API
                                          -> database
MEDIA:   Browser camera/mic -> relay/encoder -> YouTube -> embedded player
CHAT:    Website clients <-> real-time room service <-> message store
```

Suggested implementation: Node.js HTTP API (Express or Next.js handlers), PostgreSQL for persistent data, a room-based real-time service, and a dedicated media relay. The existing React + Vite frontend can call either API framework; migration is optional.

### The media relay is essential

`getUserMedia()` obtains local tracks. A normal browser cannot directly publish those tracks over YouTube's RTMPS ingestion connection. A relay must receive compatible browser media, encode as needed, and publish to YouTube. WebRTC ingestion into a media service plus FFmpeg output is one possible design; no such service is implemented here. WebRTC can require STUN/TURN depending on network conditions.

YouTube documents RTMP/RTMPS, HLS, and DASH encoder ingestion. [Protocol comparison](https://developers.google.com/youtube/v3/live/guides/ingestion-protocol-comparison), [RTMPS guide](https://developers.google.com/youtube/v3/live/guides/rtmps-ingestion).

For an initial prototype, an external encoder such as OBS can supply the media while the backend manages the broadcast. That validates playback/chat, but does not deliver the browser-camera-only one-click experience. A local relay avoids hosting charges during development; a deployed relay consumes compute and outgoing bandwidth.

## Google/YouTube setup

1. Create a Google Cloud project and enable YouTube Data API v3.
2. Configure OAuth consent and a web OAuth client with the backend callback URL. Use test users during development and check production verification requirements before launch.
3. Have each creator authorize their broadcasting channel. Creating broadcasts requires the channel owner's OAuth authorization; an API key alone is insufficient.
4. Request the minimum supported scope for the chosen endpoints (for example `https://www.googleapis.com/auth/youtube.force-ssl` for broadcast management). Store/refresh tokens server-side.
5. Check live-stream eligibility and surface channel/activation errors. The creator must enable live streaming, and first activation can involve a wait. Do not assume the mobile subscriber threshold applies to encoder streaming.

Default design: each creator connects their own channel. If using a shared channel instead, only authorized platform operators should control that connection. Viewers do not need YouTube OAuth to watch an available embedded unlisted video.

Sources: [OAuth guide](https://developers.google.com/youtube/v3/guides/authentication), [live requirements](https://support.google.com/youtube/answer/2474026), [encoder setup](https://support.google.com/youtube/answer/2907883).

## Start/stop lifecycle

1. Authenticate the creator, validate details/ownership, and reserve an application stream ID. Use an idempotency key to prevent double-clicks creating duplicate broadcasts.
2. Call `liveBroadcasts.insert` with title, scheduled start, `privacyStatus: unlisted`, and supported embedding/start settings. Set required audience/settings accurately.
3. Call `liveStreams.insert` or reuse an appropriate stream. Keep the ingest address and stream key private.
4. Call `liveBroadcasts.bind`; persist both YouTube IDs.
5. Issue an owner-only, short-lived relay session to the browser. The relay gets YouTube ingestion credentials from the backend and starts publishing media.
6. Monitor the stream until YouTube reports an active/healthy input. Use a supported auto-start configuration or the documented `liveBroadcasts.transition` flow. Creating a broadcast alone does not mean it is live.
7. Confirm live status, then update discovery/room metadata and supply the viewer embed URL. Handle embedding restrictions and YouTube errors visibly.
8. On Stop, complete the broadcast, shut down the relay, release resources, and mark the room ended. Handle disconnects/crashes with timeouts and safe retry/cleanup.

The broadcast ID is also the video ID. [Life of a Broadcast](https://developers.google.com/youtube/v3/live/life-of-a-broadcast) documents ordering and status requirements. Unlisted video can be watched/shared by anyone with the link; it is not a private authenticated paywall.

## Proposed endpoints (not implemented)

| Endpoint | Purpose |
| --- | --- |
| `GET /api/auth/youtube/start` | Start channel OAuth |
| `GET /api/auth/youtube/callback` | Validate state, exchange code, save connection |
| `GET /api/me` | Session/profile and connection status |
| `GET /api/streams` | Public discovery records |
| `GET /api/streams/:id` | Public metadata and embed URL |
| `POST /api/streams` | Authenticated creation/start request |
| `POST /api/streams/:id/relay-session` | Owner-only media session credential |
| `POST /api/streams/:id/stop` | Owner-only completion/cleanup |
| `GET /api/streams/:id/messages` | Paginated room history |
| `POST /api/creators/:id/follow` | Follow creator |
| `DELETE /api/creators/:id/follow` | Unfollow creator |
| `PATCH /api/me` | Update profile |

Creation body: `{ "title": "Building with React", "description": "...", "category": "Development" }`. Return an application ID and `starting` status. Publish subsequent statuses through real-time events or a status endpoint. Suggested states: `starting`, `waiting_for_media`, `live`, `ending`, `ended`, `error`.

Map API metadata to the UI fields listed in [FRONTEND_README.md](FRONTEND_README.md). Public responses must not contain ingestion keys or OAuth tokens. Measure actual viewer counts instead of copying demo values.

## Chat, presence, and data

Website chat is separate from YouTube chat. Authenticate connections, authorize rooms, validate/limit messages, store accepted messages, and broadcast them to the room. Suggested events: `room.join`, `chat.send`, `chat.message`, `presence.update`, `stream.status`, `error`. The server supplies sender identity/roles, IDs, and timestamps. Support reconnect/history without duplicates and expire disconnected presence.

Suggested tables:

- `users`: ID, name, avatar, bio.
- `youtube_connections`: user/channel IDs, encrypted refresh token, authorization metadata.
- `streams`: owner/room IDs, title/category, YouTube IDs, lifecycle status, timestamps, error summary.
- `messages`: ID, room/sender IDs, content, timestamp.
- `follows`: unique follower/creator pair.

Use shared pub/sub and room state across multiple service instances. Keep secrets encrypted/server-side and out of logs. Add authenticated sessions, owner checks, OAuth state validation, CSRF protection where applicable, and narrow CORS when implementing the API.

## Proposed environment (backend only)

```dotenv
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
DATABASE_URL=your-postgres-connection-string
SESSION_SECRET=generate-a-long-random-secret
TOKEN_ENCRYPTION_KEY=generate-for-your-encryption-scheme
FRONTEND_ORIGIN=http://127.0.0.1:5173
MEDIA_RELAY_URL=your-relay-service-url
MEDIA_RELAY_AUTH_SECRET=generate-a-service-secret
```

These names are a proposal and are not read by current code. Do not put backend secrets in frontend `VITE_*` variables.

## Deployment and costs

| Part | Expectation |
| --- | --- |
| Local frontend demo | No paid services required |
| YouTube API | Quota-limited access; quota units are not currency charges |
| Embedded video | YouTube handles viewer video delivery; your other services still consume resources |
| Media relay/encoder | Local prototype can use your computer; hosted compute/bandwidth may cost money |
| HTTP API, database, chat | Free allowances may cover small demos, with provider limits/terms |
| TURN (if needed) | Relayed media can add bandwidth costs |

**Do not promise an unlimited or permanently free hosted platform.** Check actual YouTube quota in Google Cloud, cache/poll sensibly, and handle exhaustion. Extra quota requires a request and potentially an audit rather than automatically purchasing more calls. [Quota overview](https://developers.google.com/youtube/v3/getting-started), [quota extension/audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits).

Vercel can host the frontend and API operations. Its June 2026 announcement documents WebSocket support in public beta, subject to Function limits/pricing; design reconnect/shared state if using it for chat. Continuous media encoding needs a deployment suited to its stream duration and compute needs, separate from short-lived API handlers. [WebSocket announcement](https://vercel.com/changelog/websocket-support-is-now-in-public-beta), [Function limits](https://vercel.com/docs/functions/limitations), [pricing](https://vercel.com/docs/pricing).

## Implementation order

1. Sessions and channel OAuth.
2. Broadcast creation/binding plus a real encoder-feed/playback test.
3. Browser media transport and dedicated relay.
4. Start/stop, status updates, retries, disconnect handling, resource cleanup.
5. Chat/presence, follows, and profile persistence.
6. Deployment after a short end-to-end broadcast/cleanup and quota check.

The frontend teammate can complete their forms independently without Google credentials.
