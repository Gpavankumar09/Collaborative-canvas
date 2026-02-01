/**
 * Room Management
 * Handles multiple canvas rooms/sessions
 */

const DrawingState = require('./drawing-state');

class RoomManager {
  constructor() {
    this.rooms = {};
  }

  /**
   * Create or get a room
   */
  getRoom(roomId) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = new DrawingState();
    }
    return this.rooms[roomId];
  }

  /**
   * Add user to room
   */
  addUserToRoom(roomId, userId) {
    const room = this.getRoom(roomId);
    const { user, color } = room.addUser(userId);
    return { user, color };
  }

  /**
   * Remove user from room
   */
  removeUserFromRoom(roomId, userId) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].removeUser(userId);
      // Clean up empty rooms
      if (Object.keys(this.rooms[roomId].users).length === 0) {
        delete this.rooms[roomId];
      }
    }
  }

  /**
   * Check if room exists and has users
   */
  roomExists(roomId) {
    return this.rooms[roomId] && Object.keys(this.rooms[roomId].users).length > 0;
  }

  /**
   * Get all rooms
   */
  getAllRooms() {
    return Object.keys(this.rooms);
  }

  /**
   * Get room stats
   */
  getRoomStats(roomId) {
    if (!this.rooms[roomId]) {
      return null;
    }
    const state = this.rooms[roomId].getState();
    return {
      roomId,
      userCount: state.userCount,
      strokeCount: state.strokes.length,
      users: state.users
    };
  }
}

module.exports = RoomManager;
