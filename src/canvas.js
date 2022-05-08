import { palette } from "./palette.js";

// --------------------
// FRAME + LAYER OBJECT
// --------------------

export class KeroFrame {
  constructor(w, h) {
    let v = w;
    v += w & 1;
    v >>= 1;
    // Buffer Rect
    this._w = w;
    this._h = h;
    this._v = v;
    // Buffer Size
    let area = v * h;
    this._area = area;

    let first, cache;
    first = new Uint8Array(area);
    cache = new Uint8Array(area);
    // Layer List
    this._current = 0;
    this._buffer = [first];
    this._cache = cache;
  }

  // ----------------------
  // LAYER INDEX OPERATIONS
  // ----------------------

  set current(idx) {
    if (index > 0 && index < this._buffer.length)
      this._current = index;
  }

  get current() {
    return this._current;
  }

  get length() {
    return this._buffer.length;
  }

  // ----------------
  // LAYER OPERATIONS
  // ----------------

  duplicate() {
    let frame, current;

    current = this._current;
    // Insert Duplicated Frame
    frame = this._buffer[current];
    frame = new Uint8Array(frame);
    this._buffer.splice(current, 0, frame);
  }

  insert() {
    let frame, current;

    current = this._current;
    // Insert New Empty Frame
    frame = new Uint8Array(this._area);
    this._buffer.splice(current, 0, frame);
  }

  remove() {
    let check, current;

    check = this._buffer.length > 1;
    // Remove if there are at least two
    if (check) {
      current = this._current;
      this._buffer.splice(current, 1);
      // Clamp Current
      if (current >= this._buffer.length) {
        current = this._buffer.length - 1;
        this._current = current;
      }
    }

    return check;
  }

  merge() {
    let current, next;
    current = this._current;
    next = current + 1;

    if (next < this._buffer.length) {
      let brc, bst;
      let src, dst;
      let mask, size;

      brc = this._buffer[current];
      bst = this._buffer[next];

      size = this._area;
      for (let i = 0; i < size; i++) {
        mask = 0xFF;
        src = brc[i];
        dst = bst[i];

        // Calculate Pixel Mask
        if (src & 0x0F) mask &= 0xF0;
        if (src & 0xF0) mask &= 0x0F;
        // Apply Pixel Mask
        dst &= mask;
        dst |= src;

        // Replace Pixel
        bst[i] = dst;
      }

      // Remove Current
      this.remove();
    }
  }

  // -----------------
  // BUFFER OPERATIONS
  // -----------------

  get buffer() {
    let current = this._current;
    return this._buffer[current];
  }

  * buffers() {
    let size = this._buffer.length - 1;
    // Iterate Backwards, Bottom to Top
    for (let i = size; i >= 0; i--)
      yield this._buffer[i];
  }

  // ----------------
  // PIXEL OPERATIONS
  // ----------------

  lookup(x, y) {
    let o, idx;
    // Pixel Location
    o = (x & 1) << 2;
    x >>= 1;
    // Pixel Index
    idx = y * this._v + x;
    idx = this.buffer[idx];

    // Return Current Pixel
    return (idx >> o) & 0xF;
  }

  put(x, y, color) {
    let o, idx, pix;
    // Pixel Location
    o = x & 1;
    x >>= 1;
    // Pixel Index
    idx = y * this._v + x;
    pix = this.buffer[idx];

    if (o) {
      pix &= 0x0F;
      pix |= color << 4;
    } else {
      pix &= 0xF0;
      pix |= color;
    }

    this.buffer[idx] = pix;
  }

  clear() {
    this.buffer.fill(0);
  }

  /**
   * 
   * @returns {Uint8Array}
   */
  flat() {
    this._cache.fill(0);
    
    let buffers = this.buffers();
    for (let buffer of buffers) {
      let src, dst, mask, size;

      size = this._area;
      for (let i = 0; i < size; i++) {
        mask = 0xFF;
        src = buffer[i]
        dst = this._cache[i];

        // Calculate Pixel Mask
        if (src & 0x0F) mask &= 0xF0;
        if (src & 0xF0) mask &= 0x0F;
        // Apply Pixel Mask
        dst &= mask;
        dst |= src;

        // Replace Pixel
        this._cache[i] = dst;
      }
    }

    return this._cache;
  }
}

// -----------------------
// RENDERING CANVAS OBJECT
// -----------------------

export class KeroCanvas {
  constructor(w, h) {
    // Canvas Rect
    this._w = w;
    this._h = h;

    // Frame List
    let first = new KeroFrame(w, h);
    this._frames = [first];
    this._current = 0;

    // Rendering Buffer
    let area = w * h;
    this.buffer = new Uint32Array(area);
  }

  // ----------------
  // FRAME OPERATIONS
  // ----------------

  set current(idx) {
    if (idx > 0 && idx < this._frames.length)
      this._current = idx;
  }

  get current() {
    return this._current;
  }

  get length() {
    return this._frames.length;
  }

  get rect() {
    return {w : this._w, h : this._h};  
  }

  get frame() {
    let current = this._current;
    return this._frames[current];
  }

  // --------------
  // RENDER METHODS
  // --------------

  render() {
    let frame, w, v, area;
    // Merge Frame Cache
    frame = this.frame.flat();
    // Buffer Size
    w = this._w;
    v = this._h;
    area = w * v;

    v = w;
    // Apply Palette to Buffer
    for (let i = 0, j = 0; i < area; i++, j++, v--) {
      let odd, o, pixel;

      if (v <= 0) {
        v = w;
        // Skip Odd
        j += w & 1;
      }

      // Pixel Position
      odd = j & 1;
      o = j >> 1;
      pixel = frame[o];
      // Get Pixel Mask
      if (odd) 
        pixel >>= 4;
      pixel &= 0xF;
      // Lookup And Apply
      pixel = palette[pixel];
      this.buffer[i] = pixel;
    }
  }
}
