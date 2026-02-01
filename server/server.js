/**
 * Collaborative Canvas Server
 * Main server entry point with Socket.IO event handlers
 */

const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const RoomManager = require('./rooms');

// Initialize Express app and Socket.IO
const app = express();
const httpServer = http.createServer(app);
const io = socketIo(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize room manager
const roomManager = new RoomManager();

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html for any route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

/**
 * Socket.IO Connection Handler
 */
io.on('connection', (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  let currentRoom = 'default';

  // Join a room
  socket.on('join-room', (roomId) => {
    currentRoom = roomId || 'default';
    socket.join(currentRoom);

    const { user, color } = roomManager.addUserToRoom(currentRoom, socket.id);
    const room = roomManager.getRoom(currentRoom);

    console.log(`[JOIN-ROOM] User ${socket.id} joined room ${currentRoom}`);

    // Send full state to new user
    socket.emit('state-sync', {
      strokes: room.strokes,
      users: room.getState().users,
      yourUserId: socket.id,
      yourColor: color
    });

    // Notify other users of new user
    socket.to(currentRoom).emit('user-connected', {
      userId: socket.id,
      color: color,
      onlineCount: room.getState().userCount
    });
  });

  // Auto-join default room
  socket.on('connect', () => {
    if (!socket.handshake.query.room) {
      currentRoom = 'default';
      socket.emit('join-room', currentRoom);
    }
  });

  // ============= DRAWING EVENTS =============

  socket.on('draw-start', (data) => {
    const room = roomManager.getRoom(currentRoom);
    const { strokeId, stroke } = room.startStroke(socket.id, data);

    socket.to(currentRoom).emit('stroke-start', {
      strokeId,
      userId: socket.id,
      tool: data.tool,
      color: data.color,
      strokeWidth: data.strokeWidth,
      x: data.x,
      y: data.y
    });
  });

  socket.on('draw', (data) => {
    const room = roomManager.getRoom(currentRoom);
    const strokeId = room.continueStroke(socket.id, data);

    if (strokeId) {
      socket.to(currentRoom).emit('stroke-draw', {
        strokeId,
        x: data.x,
        y: data.y
      });
    }
  });

  socket.on('draw-end', () => {
    const room = roomManager.getRoom(currentRoom);
    const strokeId = room.endStroke(socket.id);

    if (strokeId) {
      socket.to(currentRoom).emit('stroke-end', { strokeId });
    }
  });

  // ============= UNDO/REDO EVENTS =============

  socket.on('undo', () => {
    const room = roomManager.getRoom(currentRoom);
    const undoneStroke = room.undo();

    if (undoneStroke) {
      console.log(`[UNDO] User ${socket.id} undid stroke ${undoneStroke.id} in room ${currentRoom}`);

      io.to(currentRoom).emit('canvas-update', {
        type: 'undo',
        undoneStrokeId: undoneStroke.id,
        strokes: room.strokes
      });
    }
  });

  socket.on('redo', () => {
    const room = roomManager.getRoom(currentRoom);
    const redoneStroke = room.redo();

    if (redoneStroke) {
      console.log(`[REDO] User ${socket.id} redid stroke ${redoneStroke.id} in room ${currentRoom}`);

      io.to(currentRoom).emit('canvas-update', {
        type: 'redo',
        redoneStroke: redoneStroke,
        strokes: room.strokes
      });
    }
  });

  // ============= CURSOR EVENTS =============

  socket.on('cursor-move', (data) => {
    const room = roomManager.getRoom(currentRoom);
    room.updateCursorPosition(socket.id, data.x, data.y);
    const userColor = room.getUserColor(socket.id);

    socket.to(currentRoom).emit('cursor', {
      userId: socket.id,
      x: data.x,
      y: data.y,
      userColor: userColor
    });
  });

  // ============= DISCONNECT =============

  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] ${socket.id} from room ${currentRoom}`);
    roomManager.removeUserFromRoom(currentRoom, socket.id);

    io.to(currentRoom).emit('user-disconnected', {
      userId: socket.id,
      onlineCount: roomManager.roomExists(currentRoom) 
        ? roomManager.getRoom(currentRoom).getState().userCount 
        : 0
    });
  });
});

// ============= HTTP ROUTES =============

app.get('/api/rooms', (req, res) => {
  const rooms = roomManager.getAllRooms().map(roomId => 
    roomManager.getRoomStats(roomId)
  );
  res.json(rooms);
});

app.get('/api/room/:id', (req, res) => {
  const stats = roomManager.getRoomStats(req.params.id);
  if (stats) {
    res.json(stats);
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// ============= SERVER STARTUP =============

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`\n✅ Server started on http://localhost:${PORT}`);
  console.log(`📡 WebSocket listening for connections\n`);
});

module.exports = { app, httpServer, io, roomManager };
