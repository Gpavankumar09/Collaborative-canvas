/**
  Canvas Drawing Operations
  Handles all canvas rendering and drawing logic
 */

class CanvasManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.strokes = [];
    this.remoteStrokes = {};
    this.setupCanvas();
  }

  /**
    Setup canvas initial state
   */
  setupCanvas() {
    this.resizeCanvas();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
    Resize canvas to window size
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
    Draw a complete stroke
   */
  drawStroke(stroke, isEraser = false) {
    const points = stroke.points;
    if (points.length < 2) return;

    this.ctx.save();
    this.ctx.lineWidth = stroke.strokeWidth;
    this.ctx.strokeStyle = stroke.color;
    this.ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
    Draw a line segment
   */
  drawLineSegment(fromX, fromY, toX, toY, color, width, tool) {
    this.ctx.save();
    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = color;
    this.ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
    Redraw entire canvas from stroke history
   */
  redrawCanvas(strokes) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Redraw all strokes in order
    strokes.forEach(stroke => {
      const isEraser = stroke.tool === 'eraser';
      this.drawStroke(stroke, isEraser);
    });
  }

  /**
    Clear canvas
   */
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
    Start drawing path
   */
  beginPath(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  /**
    Continue path
   */
  lineTo(x, y) {
    this.ctx.lineTo(x, y);
  }

  /**
    Stroke the path
   */
  stroke(color, width, tool) {
    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = color;
    this.ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    this.ctx.stroke();
  }

  /**
    Close path
   */
  closePath() {
    this.ctx.closePath();
  }

  /**
    Add stroke to history
   */
  addStroke(stroke) {
    this.strokes.push(stroke);
  }

  /**
    Add remote stroke (being drawn)
   */
  addRemoteStroke(strokeId, stroke) {
    this.remoteStrokes[strokeId] = stroke;
  }

  /**
     Update remote stroke with new point
   */
  updateRemoteStroke(strokeId, point) {
    if (this.remoteStrokes[strokeId]) {
      this.remoteStrokes[strokeId].points.push(point);
    }
  }

  /**
    Finalize remote stroke
   */
  finalizeRemoteStroke(strokeId) {
    const stroke = this.remoteStrokes[strokeId];
    if (stroke) {
      this.strokes.push(stroke);
      delete this.remoteStrokes[strokeId];
    }
  }

  /**
    Get canvas context
   */
  getContext() {
    return this.ctx;
  }

  /**
    Set canvas style
   */
  setStyle(property, value) {
    this.ctx[property] = value;
  }

  /**
    Save canvas state
   */
  saveState() {
    this.ctx.save();
  }

  /**
    Restore canvas state
   */
  restoreState() {
    this.ctx.restore();
  }
}
