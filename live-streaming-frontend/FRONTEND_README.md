# Streamspace frontend

## Status and stack

React + Vite, JavaScript, plain CSS, and Lucide icons. Approximately the first half of the frontend is implemented, divided by features. The remaining frontend is intentionally available for the teammate.

No backend is running or required for this demo. Streams, viewer counts, and chat are sample content. Joining a stream shows an illustration preview unless a real embed URL is supplied. Chat and follows reset on refresh. Go live currently opens a dashboard starter; it does not create a YouTube broadcast.

## Run locally

Use a Node.js version supported by Vite 6; this project was built with Node 22. From the project root:

```sh
npm install
npm run dev
npm run build
npm run preview
```

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution is blocked. Vite prints the local address, normally http://127.0.0.1:5173. Build output is in `dist/`; preview serves that production build locally.

## Completed features

- Responsive navigation, creator list, and navy/amber/cyan design system.
- Stream discovery, title/creator search, category filters, and empty states.
- Viewer layout, creator information, description, and community guidelines.
- Local chat submission, emoji insertion, and message auto-scroll.
- Session-only following, a Following view, and copyable stream links.
- Local SVG/CSS artwork without external image dependencies.
- Sidebar navigation scrolls independently to keep the creator invitation visible. On very short windows, the entire sidebar scrolls.

## Routes

| Hash route | Current behavior |
| --- | --- |
| `#explore` | Discovery and featured viewer |
| `#watch/:streamId` | Selected stream in the viewer |
| `#following` | Creators followed during this session |
| `#studio` | Creator-dashboard starter |
| `#profile` | Profile starter |

Hash routing works on static hosting without server rewrites. Settings and Help are still teammate tasks.

## Files and remaining work

```text
src/main.jsx                     React entry point
src/App.jsx                      Routes, viewer, discovery, local state
src/styles.css                   Shared styles and responsive breakpoints
src/data/streams.js               Mock stream/chat data
src/components/Artwork.jsx       Local illustrations
src/components/ChatPanel.jsx     Message list and local form
src/components/StreamCard.jsx    Reusable stream tile
src/pages/StreamerDashboard.jsx  Teammate starter
src/pages/ProfilePage.jsx        Teammate starter
```

Follow [TEAMMATE.md](TEAMMATE.md) for the creator form, profile form, settings, and help page. Those UI tasks can be completed without Google credentials or backend services.

## Backend integration (planned)

1. Replace the mock array with stream API responses and add loading/error states.
2. Connect chat to authenticated room history and real-time events.
3. Persist follows and profile data through the backend.
4. Connect the studio form to stream creation/start/stop endpoints. Display connecting, waiting for media, live, ended, and error states.
5. After the creator chooses to start, request camera/microphone permission, preview tracks locally, and send media to the relay using the selected browser transport. Stop local tracks on Stop/leaving the studio and notify the backend.

Match existing UI fields: `id`, `title`, `creator`, `handle`, `initials`, `category`, `viewers`, `color`, `art`, `subtitle`, `description`, and `embedUrl`. Return them or map the API response into this shape. Proposed endpoints are in [BACKEND_README.md](BACKEND_README.md).

The viewer renders an iframe when `embedUrl` is supplied and Join the stream is clicked. The backend should provide a trusted YouTube embed URL, for example `https://www.youtube.com/embed/VIDEO_ID`. Embedding must be available/enabled for the broadcast/channel. This player receives video; it cannot publish camera/microphone video to YouTube.

## Environment and hosting

No environment variables are required today. A public `VITE_API_BASE_URL` can be introduced when the API exists; it is not currently read by the app. Never put Google client secrets, refresh tokens, database credentials, or stream keys in `VITE_*` variables because they are bundled for browsers.

Deploy `dist/` to a static host. Google Fonts is optional with system-font fallbacks. A quick build and desktop/mobile visual check are sufficient for this prototype; there is no test suite configured.
