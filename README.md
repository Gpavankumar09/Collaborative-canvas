# Collaborative Canvas

>A real-time collaborative drawing application — multi-user canvas with global undo/redo, brush/eraser tools, cursor presence and multi-room support.

---

## Table of contents
- [Demo](#demo)
- [Features](#features)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Technical notes](#technical-notes)
- [API](#api)
- [Development & testing](#development--testing)
- [Contributing](#contributing)
- [License](#license)

---

## Demo

Run locally and open `http://localhost:3000` in a browser. Open multiple windows to test real-time collaboration.

## Features

- Real-time multi-user drawing using Socket.IO
- Brush and Eraser tools with color and stroke-width controls
- Global undo / redo (server-canonical)
- New-client state sync (full drawing history on join)
- User presence: online list and color-coded cursor indicators
- Multi-room support and automatic room cleanup
- Deterministic redraw from server stroke history

## Project structure

Key files and folders:

- `client/` — frontend static site (HTML, CSS, JS modules)
  - `index.html` — app shell and UI
  - `style.css` — styles
  - `main.js` — application coordinator and event wiring
  - `canvas.js` — canvas rendering and drawing helpers
  - `websocket.js` — Socket.IO wrapper and events
- `server/` — Node/Express + Socket.IO server
  - `server.js` — entrypoint, socket event handlers, static file serving
  - `drawing-state.js` — canonical canvas state, undo/redo logic
  - `rooms.js` — multi-room session manager
- `package.json` — dependencies and scripts
- `ARCHITECTURE.md` — design & protocol notes

## Quick start

Prerequisites: Node.js (v14+), npm

1. Install dependencies

```powershell
cd 'e:\Desktop\Collaborative-canvas'
npm install
```

2. Run in development (nodemon)

```powershell
npm run dev
```

3. Production start

```powershell
npm start
```

The server listens on `http://localhost:3000` by default.

## Usage (Client)

- Select tool: Brush or Eraser
- Pick a color using the color picker
- Adjust stroke width (1–20 px)
- Click and drag to draw on the canvas
- Use `↶ Undo` or `↷ Redo` to modify the global canvas history
- Open the app in multiple tabs to test collaboration

Remote cursors appear as colored pointers with truncated user IDs.

## Technical notes

- The server maintains a canonical stroke history (`drawing-state.js`).
- On `undo`/`redo` the server updates the history and broadcasts the updated strokes; clients redraw deterministically.
- Strokes are simple objects `{ id, userId, tool, color, strokeWidth, points, timestamp }`.
- Room isolation: multiple rooms supported through `rooms.js`.
- Socket events (high level): `draw-start`, `draw`, `draw-end`, `cursor-move`, `undo`, `redo`, `join-room`, `state-sync`, `stroke-start`, `stroke-draw`, `stroke-end`, `canvas-update`, `user-connected`, `user-disconnected`.

### Known limitations & recommended improvements

- Large stroke histories may become large to send on every update; consider sending diffs or chunking for large sessions.
- Add schema validation on server for incoming messages to harden against malformed payloads.
- Improve reconnection handling to finalize in-progress strokes when a client disconnects mid-draw.

## API

- `GET /api/rooms` — list active rooms and stats
- `GET /api/room/:id` — stats for a single room

## Development & testing

- Use `nodemon` during development: `npm run dev`.
- To run the app locally open `http://localhost:3000`.
- You can inspect logs in the terminal — server emits informative logs for connect/disconnect/undo/redo events.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/description`
3. Make changes, run the app locally and test
4. Commit with meaningful messages
5. Open a pull request with a clear description

Ensure changes are deliberate (no auto-generated boilerplate) and include tests or manual verification steps when appropriate.

## License

This project is licensed under the ISC license. See `LICENSE` for details.

---

If you want, I can also:
- Rename `README-NEW.md` to another archive name or delete it
- Add a `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`
- Create a small GitHub Actions workflow to run lint/tests on PRs

If you'd like me to commit this `README.md` now, say 'commit' and I'll add & commit it.
