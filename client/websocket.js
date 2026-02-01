/**
 * WebSocket Connection Management
 * Handles all Socket.IO communication
 */

class WebSocketManager {
  constructor(onStateSync, onRemoteStroke, onCanvasUpdate, onUserEvent, onCursor) {
    this.socket = null;
    this.callbacks = {
      onStateSync,
      onRemoteStroke,
      onCanvasUpdate,
      onUserEvent,
      onCursor
    };
  }

  /**
   * Initialize WebSocket connection
   */
  connect() {
    this.socket = io('http://localhost:3000');

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.socket.emit('join-room', 'default');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    // State sync on connection
    this.socket.on('state-sync', (data) => {
      console.log('[WebSocket] State sync received');
      this.callbacks.onStateSync(data);
    });

    // Drawing events
    this.socket.on('stroke-start', (data) => {
      this.callbacks.onRemoteStroke('start', data);
    });

    this.socket.on('stroke-draw', (data) => {
      this.callbacks.onRemoteStroke('draw', data);
    });

    this.socket.on('stroke-end', (data) => {
      this.callbacks.onRemoteStroke('end', data);
    });

    // Canvas updates (undo/redo)
    this.socket.on('canvas-update', (data) => {
      console.log('[WebSocket] Canvas update:', data.type);
      this.callbacks.onCanvasUpdate(data);
    });

    // User events
    this.socket.on('user-connected', (data) => {
      this.callbacks.onUserEvent('connected', data);
    });

    this.socket.on('user-disconnected', (data) => {
      this.callbacks.onUserEvent('disconnected', data);
    });

    // Cursor events
    this.socket.on('cursor', (data) => {
      this.callbacks.onCursor(data);
    });
  }

  /**
   * Emit draw-start event
   */
  emitDrawStart(x, y, tool, color, strokeWidth) {
    this.socket.emit('draw-start', { x, y, tool, color, strokeWidth });
  }

  /**
   * Emit draw event
   */
  emitDraw(x, y) {
    this.socket.emit('draw', { x, y });
  }

  /**
   * Emit draw-end event
   */
  emitDrawEnd() {
    this.socket.emit('draw-end');
  }

  /**
   * Emit undo event
   */
  emitUndo() {
    this.socket.emit('undo');
  }

  /**
   * Emit redo event
   */
  emitRedo() {
    this.socket.emit('redo');
  }

  /**
   * Emit cursor-move event
   */
  emitCursorMove(x, y) {
    this.socket.emit('cursor-move', { x, y });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
