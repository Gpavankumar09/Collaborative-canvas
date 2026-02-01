# Collaborative Canvas

A real-time collaborative drawing application where multiple users can draw simultaneously on a shared canvas with full undo/redo support, drawing tools, and user presence indicators.

 Project Structure

```
collaborative-canvas/
├── client/                          # Frontend files
│   ├── index.html                   # Main HTML file
│   ├── style.css                    # Styling
│   ├── main.js                      # Application entry point
│   ├── canvas.js                    # Canvas operations & rendering
│   └── websocket.js                 # WebSocket communication
├── server/                          # Backend files
│   ├── server.js                    # Express & Socket.IO server
│   ├── rooms.js                     # Room/session management
│   └── drawing-state.js             # Canvas state management
├── package.json                     # Dependencies
├── ARCHITECTURE.md                  # Technical specification
└── README.md                        # This file
```

 Features 

# 1. Real-time Collaboration
 Multiple users can draw simultaneously
 All users see the same canvas state
 Real-time synchronization via Socket.IO

# 2. Drawing Tools
Brush Tool: Draw with customizable colors and stroke widths
Eraser Tool: Erase drawn content
Color Picker: Full spectrum color selection
Adjustable Stroke Width: 1-20px range

# 3. Global Undo/Redo
Users can undo/redo any stroke (including others' drawings)
Undo/Redo affects all connected clients globally
Deterministic canvas redraw from history
Proper redo stack management

# 4. State Management & Synchronization
Server maintains canonical stroke history
New users receive full canvas state on connection
Complete drawing history preserved
No lost strokes during session

# 5. User Management
Unique color assignment per user (10-color palette)
Online user list with color indicators
User presence tracking (connect/disconnect)
Online counter

# 6. User Cursor Indicators
Visual cursor position for other users
Color-coded cursor indicators
Cursor labels showing abbreviated user IDs
Real-time cursor position updates

# 7. Multi-Room Support
Multiple concurrent drawing sessions
Users can join different rooms
Automatic room cleanup when empty

 Installation & Running

# Prerequisites
Node.js (v14+)
npm

# Setup
```bash
cd collaborative-canvas
npm install
```

# Development
```bash
npm run dev
```

The server starts on `http://localhost:3000`

# Production
```bash
npm start
```

 How to Use

1. **Open Browser**: Navigate to `http://localhost:3000`

2. **Drawing**:
   Select tool (Brush/Eraser) from toolbar
   Choose color using color picker
   Adjust stroke width (1-20px)
   Click and drag on canvas to draw

3. **Undo/Redo**:
   Click "↶ Undo" to undo last stroke
   Click "↷ Redo" to redo undone stroke
   Works globally across all users

4. **Collaboration**:
   Open multiple browser windows
   See other users' drawings in real-time
   See other users' cursors with color indicators
   Check "Online Users" panel to see connected users

 Technical Architecture

# Backend Structure

 `server/server.js`
Main Express & Socket.IO server
Handles all WebSocket connections
Static file serving from `/client`
REST API for room statistics

 `server/drawing-state.js`
Manages all drawing operations
Stroke creation and updates
Undo/redo functionality
User color assignment
Canvas state management

 `server/rooms.js`
Multi-room session support
Room creation and cleanup
User management per room
Room statistics

# Frontend Structure

 `client/main.js`
Application entry point
Coordinates all modules
Handles UI events
Manages application state

 `client/canvas.js`
Canvas rendering operations
Stroke drawing and management
Canvas redraw functionality

 `client/websocket.js`
Socket.IO connection management
Event emission and reception
Communication abstraction

# Data Flow

 Drawing Flow
1. User draws → `draw-start` event sent to server
2. Mouse move → `draw` events sent continuously
3. Mouse up → `draw-end` event sent
4. Server broadcasts stroke to other clients
5. All clients render stroke in real-time

 Undo/Redo Flow
1. User clicks Undo → `undo` event sent to server
2. Server removes stroke from history
3. Server broadcasts full canvas state to all clients
4. All clients redraw canvas from history

 State Sync Flow
1. New user connects
2. Server sends `state-sync` with all current strokes
3. Client redraws complete canvas
4. New user sees full drawing history

# Communication Protocol

**Client → Server**:
`draw-start`: Begin new stroke with tool data
`draw`: Continue stroke with point
`draw-end`: End current stroke
`cursor-move`: Update cursor position
`undo`: Request undo
`redo`: Request redo
`join-room`: Join specific room

**Server → Client**:
`state-sync`: Full canvas state (on connection)
`stroke-start`: Other user started drawing
`stroke-draw`: Other user drawing point
`stroke-end`: Other user finished stroke
`canvas-update`: Global undo/redo update
`user-connected`: New user joined
`user-disconnected`: User left
`cursor`: Other user cursor position

# Data Models

 Stroke
```javascript
{
  id: string,              // Unique stroke ID
  userId: string,          // Creator's user ID
  tool: 'brush' | 'eraser',
  color: string,           // Hex color
  strokeWidth: number,     // 1-20
  points: [{x, y}, ...],   // Stroke path
  timestamp: number        // Creation time
}
```

 User
```javascript
{
  id: string,              // Socket ID
  color: string,           // Assigned color
  cursorX: number,
  cursorY: number,
  isDrawing: boolean,
  online: boolean
}
```

 API Endpoints

# GET `/api/rooms`
Returns list of all active rooms with statistics

# GET `/api/room/:id`
Returns statistics for a specific room

