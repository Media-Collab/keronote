import { dithers } from "./palette.js";
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
    this.invert = false;

    // Brush Line Path
    this._start = 0.0;
    this._stack = [];
  }

  // -----------------------
  // BRUSH DITHERING PATTERN
  // -----------------------

  check(x, y) {
    let d, i;

    d = this.dither;
    i = this.invert;
    return (d >= dithers.length) || (
      d = dithers[d], i ? d.inverted(x, y) : d.check(x, y)
    );
  }

  // ------------------
  // BRUSH FILL METHODS
  // ------------------

  flood(color0, color1) {
    let canvas, rect, frame;

    canvas = this._canvas;
    rect = canvas.rect;
    frame = canvas.frame;

    while (this._stack.length > 0) {
      let p, x, y;

      p = this._stack.pop();
      x = p.x;
      y = p.y;

      // Check Coordinates Boundaries
      if (x >= 0 && y >= 0 && x < rect.w && y < rect.h) {
        let mask = frame.lookup(x, y);
        if (mask == color0 && mask != color1) {
          frame.put(x, y, color1);
          // Push New 4 Points
          this._stack.push({x: x - 1, y: y});
          this._stack.push({x: x + 1, y: y});
          this._stack.push({x: x, y: y - 1});
          this._stack.push({x: x, y: y + 1});
        }
      }
    }
  }

  fill(x, y) {
    let canvas, rect;

    // Canvas Rect
    canvas = this._canvas;
    rect = canvas.rect;

    if (x >= 0 && y >= 0 && x < rect.w, y < rect.h) {
      let frame, color0, color1;

      frame = canvas.frame;
      color0 = frame.lookup(x, y);
      color1 = this.color;
      // Apply Floodfill
      frame.duplicate();

      this._stack.push({x: x, y: y});
      this.flood(color0, color1);
      // Apply Dithering
      for (let idx = 0, yy = 0; yy < rect.h; yy++) {
        for (let xx = 0; xx < rect.w; xx++, idx++) {
          // Remove Dead Pixels
          if (!this.check(xx, yy))
            frame.put(xx, yy, 0);
        }
      }

      // Merge Layers
      frame.merge();
    }
  }

  // ------------------
  // BRUSH DRAW METHODS
  // ------------------

  point(x, y) {
    let canvas, rect, frame;

    // Canvas Buffer Size
    canvas = this._canvas;
    rect = canvas.rect;
    // Current Frame
    frame = canvas.frame;

    let size, w, h;
    let x1, x2, y1, y2;
    // Calculate Buffer Size
    size = this.size;
    w = rect.w;
    h = rect.h;
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