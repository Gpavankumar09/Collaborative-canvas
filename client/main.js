/**
 * Collaborative Canvas - Client Main
 * Coordinates all client-side functionality
 */

// ============= DOM ELEMENTS =============
const canvas = document.getElementById('canvas');
const toolSelect = document.getElementById('toolSelect');
const colorInput = document.getElementById('colorInput');
const strokeWidthInput = document.getElementById('strokeWidth');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const userList = document.getElementById('userList');
const onlineCount = document.getElementById('onlineCount');

// ============= MANAGERS =============
let canvasManager;
let wsManager;

// ============= CLIENT STATE =============
const clientState = {
  userId: null,
  userColor: null,
  currentTool: 'brush',
  currentColor: '#000000',
  strokeWidth: 2,
  mouseDown: false,
  remoteUsers: {},
  currentStrokeId: null
};

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
  initializeCanvas();
  initializeWebSocket();
  setupEventListeners();
});

/**
 * Initialize canvas manager
 */
function initializeCanvas() {
  canvasManager = new CanvasManager(canvas);
  console.log('[INIT] Canvas initialized');
}

/**
 * Initialize WebSocket manager
 */
function initializeWebSocket() {
  wsManager = new WebSocketManager(
    onStateSync,
    onRemoteStroke,
    onCanvasUpdate,
    onUserEvent,
    onCursor
  );
  wsManager.connect();
  console.log('[INIT] WebSocket initialized');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Tool selection
  toolSelect.addEventListener('change', (e) => {
    clientState.currentTool = e.target.value;
  });

  // Color selection
  colorInput.addEventListener('change', (e) => {
    clientState.currentColor = e.target.value;
  });

  // Stroke width
  strokeWidthInput.addEventListener('change', (e) => {
    clientState.strokeWidth = parseInt(e.target.value);
    document.getElementById('widthValue').textContent = e.target.value;
  });

  strokeWidthInput.addEventListener('input', (e) => {
    document.getElementById('widthValue').textContent = e.target.value;
  });

  // Undo/Redo buttons
  undoBtn.addEventListener('click', () => {
    wsManager.emitUndo();
  });

  redoBtn.addEventListener('click', () => {
    wsManager.emitRedo();
  });

  // Canvas drawing events
  canvas.addEventListener('mousedown', handleCanvasMouseDown);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseup', handleCanvasMouseUp);
  canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
}

// ============= CANVAS EVENT HANDLERS =============

function handleCanvasMouseDown(e) {
  if (!clientState.userId) return;

  clientState.mouseDown = true;
  clientState.currentStrokeId = generateId();

  const x = e.clientX;
  const y = e.clientY;

  // Emit draw-start
  wsManager.emitDrawStart(x, y, clientState.currentTool, clientState.currentColor, clientState.strokeWidth);

  // Draw locally
  canvasManager.beginPath(x, y);
}

function handleCanvasMouseMove(e) {
  const x = e.clientX;
  const y = e.clientY;

  // Broadcast cursor
  wsManager.emitCursorMove(x, y);

  // Continue drawing
  if (clientState.mouseDown) {
    canvasManager.lineTo(x, y);
    canvasManager.stroke(clientState.currentColor, clientState.strokeWidth, clientState.currentTool);

    // Emit draw
    wsManager.emitDraw(x, y);
  }
}

function handleCanvasMouseUp() {
  if (clientState.mouseDown) {
    clientState.mouseDown = false;
    canvasManager.closePath();
    wsManager.emitDrawEnd();
  }
}

function handleCanvasMouseLeave() {
  if (clientState.mouseDown) {
    clientState.mouseDown = false;
    canvasManager.closePath();
    wsManager.emitDrawEnd();
  }
}

// ============= WEBSOCKET CALLBACKS =============

function onStateSync(data) {
  console.log('[CALLBACK] State sync received');
  clientState.userId = data.yourUserId;
  clientState.userColor = data.yourColor;

  // Set initial strokes
  data.strokes.forEach(stroke => canvasManager.addStroke(stroke));

  // Set remote users
  clientState.remoteUsers = data.users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  // Redraw canvas
  canvasManager.redrawCanvas(data.strokes);
  updateUserList();
  updateRemoteCursors();
}

function onRemoteStroke(action, data) {
  if (action === 'start') {
    canvasManager.addRemoteStroke(data.strokeId, {
      id: data.strokeId,
      userId: data.userId,
      tool: data.tool,
      color: data.color,
      strokeWidth: data.strokeWidth,
      points: [{ x: data.x, y: data.y }]
    });
  } else if (action === 'draw') {
    const stroke = canvasManager.remoteStrokes[data.strokeId];
    if (stroke) {
      canvasManager.updateRemoteStroke(data.strokeId, { x: data.x, y: data.y });

      // Draw line segment
      const prevPoint = stroke.points[stroke.points.length - 1];
      canvasManager.drawLineSegment(prevPoint.x, prevPoint.y, data.x, data.y, stroke.color, stroke.strokeWidth, stroke.tool);
    }
  } else if (action === 'end') {
    canvasManager.finalizeRemoteStroke(data.strokeId);
  }
}

function onCanvasUpdate(data) {
  console.log('[CALLBACK] Canvas update:', data.type);
  // Redraw from updated strokes
  canvasManager.redrawCanvas(data.strokes);
}

function onUserEvent(event, data) {
  if (event === 'connected') {
    console.log('[CALLBACK] User connected:', data.userId);
    clientState.remoteUsers[data.userId] = {
      id: data.userId,
      color: data.color,
      cursorX: 0,
      cursorY: 0,
      online: true
    };
    updateUserList();
    updateRemoteCursors();
  } else if (event === 'disconnected') {
    console.log('[CALLBACK] User disconnected:', data.userId);
    delete clientState.remoteUsers[data.userId];
    document.getElementById(`cursor-${data.userId}`)?.remove();
    updateUserList();
  }
}

function onCursor(data) {
  if (clientState.remoteUsers[data.userId]) {
    clientState.remoteUsers[data.userId].cursorX = data.x;
    clientState.remoteUsers[data.userId].cursorY = data.y;
    updateCursorPosition(data.userId, data.x, data.y);
  }
}

// ============= UI UPDATES =============

function updateUserList() {
  userList.innerHTML = '';
  const users = Object.values(clientState.remoteUsers);

  users.forEach(user => {
    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.innerHTML = `
      <div class="user-color" style="background-color: ${user.color}"></div>
      <span class="user-id">${user.id.substr(0, 8)}</span>
    `;
    userList.appendChild(userEl);
  });

  onlineCount.textContent = users.length;
}

function updateRemoteCursors() {
  document.querySelectorAll('.remote-cursor').forEach(el => el.remove());

  Object.entries(clientState.remoteUsers).forEach(([userId, user]) => {
    if (user.cursorX && user.cursorY) {
      const cursorEl = document.createElement('div');
      cursorEl.className = 'remote-cursor';
      cursorEl.id = `cursor-${userId}`;
      cursorEl.innerHTML = `
        <div class="cursor-pointer" style="border-color: ${user.color};">
          <div class="cursor-label" style="background-color: ${user.color};">
            ${user.id.substr(0, 6)}
          </div>
        </div>
      `;
      cursorEl.style.left = user.cursorX + 'px';
      cursorEl.style.top = user.cursorY + 'px';
      document.body.appendChild(cursorEl);
    }
  });
}

function updateCursorPosition(userId, x, y) {
  const cursorEl = document.getElementById(`cursor-${userId}`);
  if (cursorEl) {
    cursorEl.style.left = x + 'px';
    cursorEl.style.top = y + 'px';
  }
}

// ============= HELPER =============

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
