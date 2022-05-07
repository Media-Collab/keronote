import { KeroCanvas } from "./canvas.js";

function clamp(x, a, b) {
  return (x < a) ? a : ((x > b) ? b : x);
}

export class KeroDraw {
  /**
   *
   * @param {KeroCanvas} canvas 
   */
  constructor(canvas) {
    this._canvas = canvas;

    // Brush Status
    this.size = 0;
    this.color = 0;
    this.dither = 0;
    // Brush Line Path
    this._start = 0.0;
  }

  // ------------------
  // BRUSH DRAW METHODS
  // ------------------

  check(x, y) {
    return true;
  }

  point(x, y) {
    let canvas, dimensions, frame;

    // Canvas Buffer Size
    canvas = this._canvas;
    dimensions = canvas.dimensions;
    // Current Frame
    frame = canvas.frame;

    let size, w, h;
    let x1, x2, y1, y2;
    // Calculate Buffer Size
    size = this.size;
    w = dimensions.w;
    h = dimensions.h;
    // Calculate Coordinates
    x1 = clamp(x - size, 0, w);
    x2 = clamp(x + size, 0, w);
    y1 = clamp(y - size, 0, h);
    y2 = clamp(y + size, 0, h);
    // Squared Size
    size *= size;

    for (let yy = y1; yy < y2; yy++) {
      for (let xx = x1; xx < x2; xx++) {
        let px = xx - x;
        let py = yy - y;

        let check0, check1;
        check0 = px * px + py * py < size;
        check1 = this.check(xx, yy);

        // Put Pixel Inside Circle
        if (check0 && check1) {
          let color = this.color;
          frame.put(xx, yy, color);
        }
      }
    }
  }

  line(a, b) {
    let x1, y1, x2, y2;
    // Coordinates
    x1 = a.x;
    x2 = b.x;
    y1 = a.y;
    y2 = b.y;

    let dx, dy, sx, sy, err;
    dx = Math.abs(x2 - x1);
    dy = Math.abs(y2 - y1);
    sx = x1 < x2 ? 1 : -1;
    sy = y1 < y2 ? 1 : -1;
    err = dx - dy;

    while (x1 != x2 || y1 != y2) {
      var e2 = 2 * err;
      if (e2 > (dy * -1)) {
          err -= dy;
          x1 += sx;
      }
      if (e2 < dx) {
          err += dx;
          y1 += sy;
      }
      // Draw Point
      this.point(x1, y1);  
    }
  }

  // -------------------------
  // BRUSH STROKE PATH METHODS
  // -------------------------

  first(x, y) {
    let p = {x : x, y : y};
    // Set Current Points
    this._a = p;
    this._b = p;
  }

  push(x, y) {
    this._a = this._b;
    this._b = {x : x, y : y};
  }

  dispatch() {
    let a, b;
    a = this._a;
    b = this._b;
    this.line(a, b);
  }
}