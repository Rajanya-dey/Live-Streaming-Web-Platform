# Your half of the frontend

The layout, discovery screen, viewer, and chat UI are ready. You can focus on beginner-friendly forms and supporting pages. Keep everything local in React state for now; backend integration is a separate task.

## 1. Creator dashboard

Start in `src/pages/StreamerDashboard.jsx`. Replace the starter content with:

1. A stream title text input and a description textarea.
2. A category select using Development, Design, AI & ML, and Just chatting.
3. Camera and microphone selects with sample options. Device access is not needed yet.
4. A simple preview rectangle.
5. Start / Stop buttons that change a local `isStreaming` boolean and show a visible status. Label this a demo.

Use `useState` for each field. Add a basic required-title check. Reuse `.primary-button`, `.eyebrow`, and the CSS variables in `src/styles.css`.

## 2. Profile

Start in `src/pages/ProfilePage.jsx`. Add a display name input, a short bio textarea, and a Save button. Show a “Profile saved for this session” message after saving. Optional: let users choose one of the existing avatar colors.

## 3. Supporting pages

Create `src/pages/SettingsPage.jsx` for local notification/theme preferences and `src/pages/HelpPage.jsx` for simple FAQ content. Add `#settings` and `#help` links and explicit route branches in `src/App.jsx`. Use the current page components as examples. These pages plus the two forms are the planned remaining half of the frontend.

## Tips

- Add page-specific CSS at the bottom of `src/styles.css`, before the media queries, using names like `.studio-form` and `.profile-form`.
- Use real `<label>` elements for inputs and `type="button"` for buttons inside forms that should not submit.
- Check the pages once on your phone or a narrow browser window.
- You do not need to modify `ChatPanel`, `Artwork`, or `StreamCard`.
- Do not add backend services, API secrets, or real streaming while working on these UI tasks.

## Later backend handoff

The backend owner can replace `src/data/streams.js` with API records, provide a trusted YouTube `embedUrl` per stream, connect chat to WebSocket messages, and persist follows/profile data with authentication. The existing viewer already has an iframe branch for a supplied embed URL. Backend work is outside this frontend split.
