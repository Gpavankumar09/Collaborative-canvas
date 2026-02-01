# Collaborative Canvas Architecture & Specification

 Overview
A realtime collaborative drawing application where multiple users can draw simultaneously on a shared canvas. All users see the same canvas state with full undo/redo support.

 Core Data Models

# User
```
{
  id: string (socket.id)
  color: string (hex color assigned on connection)
  cursorX: number
  cursorY: number
  isDrawing: boolean
  online: boolean
}
```

# Stroke (Action)
{
  id: string (UUID)
  userId: string (socket.id)
  tool: 'brush' | 'eraser'
  color: string (hex)
  strokeWidth: number
  points: [
    { x: number, y: number },
    { x: number, y: number },

  ]
  timestamp: number
}


# Canvas State
```
{
  strokes: Stroke[]           // All strokes in order
  history: Stroke[]           // Undo stack
  redoStack: Stroke[]         // Redo stack
  users: User[]               // Connected users
}
```

 Communication Protocol

# Client → Server Events

 `drawstart`
Sent when mouse goes down
```json
{
  "x": number,
  "y": number,
  "tool": "brush" | "eraser",
  "color": string,
  "strokeWidth": number
}
```

 `draw`
Sent continuously while drawing
```json
{
  "x": number,
  "y": number
}
```

 `drawend`
Sent when mouse goes up (no data)

 `cursormove`
Sent on mouse move
```json
{
  "x": number,
  "y": number
}
```

 `undo`
Request to undo last stroke (no data)

 `redo`
Request to redo last stroke (no data)

# Server → Client Events

 `strokestart`
Another user started drawing
```json
{
  "strokeId": string,
  "userId": string,
  "tool": "brush" | "eraser",
  "color": string,
  "strokeWidth": number,
  "x": number,
  "y": number
}
```

 `strokedraw`
Another user is drawing
```json
{
  "strokeId": string,
  "x": number,
  "y": number
}
```

 `strokeend`
Another user finished drawing (completes stroke)
```json
{
  "strokeId": string
}
```

 `statesync`
Full canvas state (sent on connection and after undo/redo)
```json
{
  "strokes": Stroke[],
  "users": User[],
  "yourUserId": string,
  "yourColor": string
}
```

 `userconnected`
New user joined
```json
{
  "userId": string,
  "color": string,
  "onlineCount": number
}
```

 `userdisconnected`
User left
```json
{
  "userId": string,
  "onlineCount": number
}
```

 `cursor`
Other user's cursor position
```json
{
  "userId": string,
  "x": number,
  "y": number,
  "userColor": string
}
```

 `undo`
Stroke was undone globally
```json
{
  "undoneStrokeId": string,
  "strokes": Stroke[]
}
```

 `redo`
Stroke was redone globally
```json
{
  "redoneStroke": Stroke,
  "strokes": Stroke[]
}
```

 ServerSide Logic

# Stroke History Management
1. **strokes[]** Canonical list of all active strokes (appendonly during session)
2. **history[]** Stack for undo operations
3. **redoStack[]** Stack for redo operations

# Undo/Redo Policy
**Undo**: Last stroke is removed from `strokes[]`, added to `redoStack[]`, and full state is broadcast
**Redo**: Last stroke from `redoStack[]` is moved back to `strokes[]`, and full state is broadcast
**No conflicts**: Server is source of truth; undo/redo affects global state immediately

# Conflict Handling
Simultaneous strokes by different users: Both are preserved (order by server receipt time)
Visual stacking: Later strokes drawn on top (by design)
Deterministic order: Server maintains timestampbased ordering

# New User Joining
1. Assign unique color from color pool
2. Send full `statesync` event with all current strokes
3. Broadcast `userconnected` to all other users
4. New user now sees complete canvas history

 ClientSide Logic

# Tool State
```javascript
{
  currentTool: 'brush' | 'eraser',
  currentColor: string (hex),
  strokeWidth: number,
  userId: string,
  userColor: string
}
```

# Drawing Flow
1. **Mouse down** → Emit `drawstart` with tool state
2. **Mouse move** → Emit `draw` with points (while drawing locally)
3. **Mouse up** → Emit `drawend`
4. **On receive strokestart** → Create new stroke path
5. **On receive strokedraw** → Extend path
6. **On receive strokeend** → Finalize stroke

# Canvas Redraw
Full redraw happens on: undo, redo, new user statesync
Incremental draw happens on: live draw events
Clear canvas, replay all strokes from history in order

 Features

# 1. Drawing Tools 
**Brush**: Normal drawing with color
**Eraser**: Special tool that uses globalCompositeOperation = 'destinationout'
**Color Picker**: 10 predefined colors + custom
**Stroke Width**: 120px adjustable

# 2. Global Undo/Redo 
One user can undo another user's drawing
Server maintains canonical state
All clients sync to server state after undo/redo
Visual feedback shows which stroke was undone

# 3. State Synchronization 
Server stores all strokes
New users receive full state on connection
All users see same canvas (eventually consistent)
No lost strokes during disconnection

# 4. Conflict Handling 
Simultaneous strokes preserved in order received
No race conditions (server is authority)
Last write doesn't win; all writes preserved

# 5. User Indicators 
User list showing online users
Cursor position indicator for other users
Colorcoded cursors
Online count display

 Implementation Plan

# Phase 1: Backend Enhancement
[ ] Add stroke history management
[ ] Implement undo/redo logic
[ ] Add statesync event
[ ] Add user tracking

# Phase 2: Frontend Enhancement
[ ] Add drawing tools UI
[ ] Implement tool state tracking
[ ] Add undo/redo buttons
[ ] Add user list display

# Phase 3: Realtime Synchronization
[ ] Implement cursor broadcasting
[ ] Full state sync on connection
[ ] Stroke history management on client

# Phase 4: Polish
[ ] User color assignment
[ ] Visual feedback
[ ] Error handling
[ ] Performance optimization
