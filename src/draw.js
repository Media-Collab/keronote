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
    this.tool = 0;
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

  rect(x, y, w, h) {
    let canvas, r, frame;

    // Canvas Buffer Size
    canvas = this._canvas;
    r = canvas.rect;
    // Current Frame
    frame = canvas.frame;

    let size, rw, rh;
    let x1, x2, y1, y2;
    // Calculate Buffer Size
    size = this.size;
    rw = r.w;
    rh = r.h;
    // Calculate Coordinates
    x1 = clamp(x, 0, rw);
    x2 = clamp(x + w, 0, rw);
    y1 = clamp(y, 0, rh);
    y2 = clamp(y + h, 0, rh);
    // Squared Size
    size *= size;

    for (let yy = y1; yy < y2; yy++) {
      for (let xx = x1; xx < x2; xx++) {
        if (this.check(xx, yy))
          frame.put(xx, yy, this.color);
      }
    }
  }

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

  // -------------------------
  // BRUSH STROKE PATH METHODS
  // -------------------------

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

  circle(a, b) {
    let dx, dy, r;
    dx = b.x - a.x;
    dy = b.y - a.y;
    // Calculate Radius
    r = Math.sqrt(dx * dx + dy * dy);
    r = Math.round(r);
    // Define Circle Algoritm Variables
    let x = r, y = 0, x0 = a.x, y0 = a.y;
    let radiusError = 1 - x;

    while (x >= y) {
      this.point(x + x0, y + y0);
      this.point(y + x0, x + y0);
      this.point(x0 - x, y + y0);
      this.point(x0 - y, x + y0);
      this.point(x0 - x, y0 - y);
      this.point(x0 - y, y0 - x);
      this.point(x + x0, y0 - y);
      this.point(y + x0, y0 - x);
      y++;
      
      if (radiusError < 0) {
          radiusError += 2 * y + 1;
      }
      else {
          x--;
          radiusError += 2 * (y - x + 1);
      }
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

    // Create Temporal Layer
    let frame = this._canvas.frame;
    if (this.tool > 0) {
      frame.insert();

      // Set Stencil Check
      let stencil = this.color == 0;
      if (stencil) this.color = 1;
      frame.stencil = stencil;
    }
  }

  push(x, y) {
    if (this.tool == 0)
      this._a = this._b;
    this._b = {x : x, y : y};
  }

  dispatch() {
    let a, b;
    a = this._a;
    b = this._b;

    let x, y, w, h;
    // Clear Temporal Layer
    if (this.tool > 0)
      this._canvas.frame.clear();

    switch (this.tool) {
      case 0: // Brush, Line
      case 1:
        this.line(a, b);
        break;
      case 2: // Rectangle
        w = Math.abs(b.x - a.x);
        h = Math.abs(b.y - a.y);
        // Calculate Min X, Min Y
        x = (b.x < a.x) ? b.x : a.x;
        y = (b.y < a.y) ? b.y : a.y;
        // Calculate Four Points
        let p0, p1, p2, p3;
        p0 = {x: x, y: y};
        p1 = {x: x + w, y: y};
        p2 = {x: x, y: y + h};
        p3 = {x: x + w, y: y + h};
        // Draw Four Lines
        this.line(p0, p1);
        this.line(p0, p2);
        this.line(p3, p1);
        this.line(p3, p2);
        break;
      case 3: // Circle
        this.circle(a, b);
        break;
      case 4: // Rectangle Fill
        w = Math.abs(b.x - a.x);
        h = Math.abs(b.y - a.y);
        // Calculate Min X, Min Y
        x = (b.x < a.x) ? b.x : a.x;
        y = (b.y < a.y) ? b.y : a.y;
        // Fill Rectangle
        this.rect(x, y, w, h);
        break;
      case 5: // Circle Fill
        let bak, dx, dy, r;
        bak = this.size;
        // Calculate Circle Radius
        dx = b.x - a.x, dy = b.y - a.y;
        r = Math.sqrt(dx * dx + dy * dy);
        
        this.size = Math.round(r);
        this.point(a.x, a.y);
        this.size = bak;
    }
  }

  finally() {
    // Merge Temporal Layer
    if (this.tool > 0) {
        let frame = this._canvas.frame;
        let stencil = frame.stencil;
        // Merge Frame
        frame.merge();

        // Restore Color Stencil
        if (stencil) {
          this.color = 0;
          frame.stencil = false;
        }
    }
  }
}
