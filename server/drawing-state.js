/**
 * Drawing State Management
 * Handles all canvas state, strokes, and undo/redo operations
 */

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52B788'
];

class DrawingState {
  constructor() {
    this.strokes = [];           // All active strokes
    this.redoStack = [];         // Redo stack
    this.users = {};             // userId -> User object
    this.currentStroke = {};     // strokeId -> partial stroke being drawn
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get next available color from palette
   */
  getNextColor() {
    const usedColors = Object.values(this.users).map(u => u.color);
    for (let color of COLORS) {
      if (!usedColors.includes(color)) {
        return color;
      }
    }
    return COLORS[0]; // fallback
  }

  /**
   * Add a new user to the canvas state
   */
  addUser(userId) {
    const userColor = this.getNextColor();
    const user = {
      id: userId,
      color: userColor,
      cursorX: 0,
      cursorY: 0,
      isDrawing: false,
      online: true
    };
    this.users[userId] = user;
    return { user, color: userColor };
  }

  /**
   * Start a new stroke
   */
  startStroke(userId, data) {
    const strokeId = this.generateId();
    const stroke = {
      id: strokeId,
      userId,
      tool: data.tool,
      color: data.color,
      strokeWidth: data.strokeWidth,
      points: [{ x: data.x, y: data.y }],
      timestamp: Date.now()
    };

    this.currentStroke[strokeId] = stroke;
    this.users[userId].isDrawing = true;

    return { strokeId, stroke };
  }

  /**
   * Continue stroke with new point
   */
  continueStroke(userId, data) {
    const strokeEntry = Object.entries(this.currentStroke).find(
      ([_, stroke]) => stroke.userId === userId
    );

    if (strokeEntry) {
      const [strokeId, stroke] = strokeEntry;
      stroke.points.push({ x: data.x, y: data.y });
      return strokeId;
    }
    return null;
  }

  /**
   * End current stroke
   */
  endStroke(userId) {
    const strokeEntry = Object.entries(this.currentStroke).find(
      ([_, stroke]) => stroke.userId === userId
    );

    if (strokeEntry) {
      const [strokeId, stroke] = strokeEntry;
      this.strokes.push(stroke);
      delete this.currentStroke[strokeId];
      this.redoStack = []; // Clear redo on new action
      this.users[userId].isDrawing = false;
      return strokeId;
    }
    return null;
  }

  /**
   * Undo last stroke
   */
  undo() {
    if (this.strokes.length > 0) {
      const undoneStroke = this.strokes.pop();
      this.redoStack.push(undoneStroke);
      return undoneStroke;
    }
    return null;
  }

  /**
   * Redo last undone stroke
   */
  redo() {
    if (this.redoStack.length > 0) {
      const redoneStroke = this.redoStack.pop();
      this.strokes.push(redoneStroke);
      return redoneStroke;
    }
    return null;
  }

  /**
   * Update user cursor position
   */
  updateCursorPosition(userId, x, y) {
    if (this.users[userId]) {
      this.users[userId].cursorX = x;
      this.users[userId].cursorY = y;
    }
  }

  /**
   * Remove user from state
   */
  removeUser(userId) {
    delete this.users[userId];
  }

  /**
   * Get current canvas state
   */
  getState() {
    return {
      strokes: this.strokes,
      users: Object.values(this.users),
      userCount: Object.keys(this.users).length
    };
  }

  /**
   * Get color assigned to user
   */
  getUserColor(userId) {
    return this.users[userId]?.color || null;
  }
}

module.exports = DrawingState;
