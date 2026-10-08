# Streamspace

A streaming community website built with React + Vite. Creators are intended to broadcast through YouTube; viewers watch an embedded player and use the website's own chat.

**Current status: approximately 50% of the frontend is complete. There is no backend or real broadcasting yet.** Go live opens the dashboard starter. Streams, viewer counts, and chat are demo data.

## Documentation

- [Frontend README](FRONTEND_README.md): setup, routes, components, completed features, and integration points.
- [Backend README](BACKEND_README.md): planned YouTube integration, media relay, OAuth, API contracts, deployment, and costs. This is an implementation guide, not an existing backend.
- [Teammate handoff](TEAMMATE.md): beginner-friendly tasks for the remaining frontend.

## Quick start

```sh
npm install
npm run dev
```

Open the Vite URL (normally http://127.0.0.1:5173). On PowerShell, use `npm.cmd` if `npm` is blocked by script restrictions. `npm run build` creates `dist/`; `npm run preview` serves the build locally.

## Intended Go live flow

After connecting a live-enabled YouTube channel and granting camera/microphone permission:

1. The creator enters stream details and clicks Go live.
2. The backend creates an unlisted YouTube broadcast and binds a stream to it.
3. The browser sends camera/microphone media to a relay/encoder, which publishes it to YouTube.
4. Once healthy media arrives and YouTube reports live status, the website displays the embedded player.
5. Viewers join the website's chat. Stop ends the broadcast and releases relay resources.

The API manages the broadcast; it does not capture/transmit browser media. The separate relay is essential to the browser-only experience. See the backend guide and [YouTube's broadcast lifecycle](https://developers.google.com/youtube/v3/live/life-of-a-broadcast).
