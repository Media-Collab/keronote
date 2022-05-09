import { palette } from "./palette.js";

// -------------------------
// BUFFER BLENDING & ERASING
// -------------------------

/**
 * 
 * @param {Uint8Array} brc 
 * @param {Uint8Array} bst 
 */
function blend(brc, bst) {
  let src, dst, mask;
  let s0, s1, size;

  s0 = brc.length;
  s1 = bst.length;
  size = (s0 < s1) ? s0 : s1;
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
}

/**
 * 
 * @param {Uint8Array} brc 
 * @param {Uint8Array} bst 
 */
function replace(brc, bst, color) {
  let src, dst, mask;
  let s0, s1, size;

  s0 = brc.length;
  s1 = bst.length;
  size = (s0 < s1) ? s0 : s1;

  color = color & 0x0F;
  color = color | (color << 4);
  for (let i = 0; i < size; i++) {
    mask = 0xFF;
    src = brc[i];
    dst = bst[i];

    // Calculate Pixel Mask
    if (src & 0x0F) mask &= 0xF0;
    if (src & 0xF0) mask &= 0x0F;
    // Apply Pixel Mask
    src = color & ~mask;
    dst &= mask, dst |= src;

    // Replace Pixel
    bst[i] = dst;
  }
}

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
    this.stencil = false;
    this._current = 0;
    // Buffer List
    this.cache = cache;
    this._buffer = [first];
  }

  // ----------------------
  // LAYER INDEX OPERATIONS
  // ----------------------

  set current(idx) {
    if (idx >= 0 && idx < this._buffer.length)
      this._current = idx;
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
      brc = this._buffer[current];
      bst = this._buffer[next];

      if (this.stencil) 
        replace(brc, bst, 0);
      else blend(brc, bst);

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

  empty() {
    this._buffer = [];
    this._current = 0;
    this.cache.fill(0);
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

  /**
   * 
   * @param {Uint8Array} buffer 
   */
  replace(buffer) {
    let current = this._current;
    current = this._buffer[current];
    current.set(buffer);
  }

  clear() {
    this.buffer.fill(0);
  }

  /**
   * 
   * @returns {Uint8Array}
   */
  flat() {
    this.cache.fill(0);
    
    let buffers = this.buffers();
    for (let buffer of buffers) {
      // Blend or Erase Rendering
      if (buffer == this.buffer && this.stencil)
        replace(buffer, this.cache, 0);
      else blend(buffer, this.cache)
    }

    return this.cache;
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
    this.cache = new Uint8Array(area);

    // Onion Skin
    this.onion = 0;
  }

  // ----------------------
  // FRAME INDEX OPERATIONS
  // ----------------------

  set current(idx) {
    if (idx >= 0 && idx < this._frames.length)
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

  * frames() {
    let size = this._frames.length;
    // Iterate Forward
    for (let i = 0; i < size; i++)
      yield this._frames[i];
  }

  get frame() {
    let current = this._current;
    return this._frames[current];
  }

  empty() {
    this._frames = [];
    this._current = 0;
    this.cache.fill(0);
  }

  // ----------------------
  // FRAME INDEX OPERATIONS
  // ----------------------

  insert() {
    let frame, current;

    current = this._current + 1;
    // Insert New Empty Frame
    frame = new KeroFrame(this._w, this._h);
    this._frames.splice(current, 0, frame);
    // Set Current to Next Frame
    this.current = current;
  }

  remove() {
    let check, current, len;

    check = this._frames.length > 0;
    // Remove if there are at least two
    if (check) {
      current = this._current;
      this._frames.splice(current, 1);
      // Get New Length
      len = this._frames.length;

      if (len <= 0) {
        // Create New Empty Frame
        let frame = new KeroFrame(this._w, this._h);
        this._frames.push(frame);
      } else if (current >= len) {
        // Clamp Current Frame
        current = len - 1;
        this.current = current;
      }
    }

    return check;
  }

  // --------------
  // RENDER METHODS
  // --------------

  ghost() {
    let onion = this.onion;
    let len = this._frames.length;
    if (onion > 0 && len > 1) {
      // Current Index
      let current, original;
      original = this.current;

      let cache, frame;
      // Clear Cache Ghost
      cache = this.cache;
      cache.fill(0);

      current = original;
      // Ghost Backwards
      for (let i = 0; i < onion; i++) {
        if (--current < 0) break;
        frame = this._frames[current];
        replace(frame.cache, cache, 2);
      }

      current = original;
      // Ghost Forwards
      for (let i = 0; i < onion; i++) {
        if (++current >= len) break;
        frame = this._frames[current];
        replace(frame.cache, cache, 2);
      }

      // Blend Current
      current = original;
      frame = this.frame.flat();
      blend(frame, cache);

      return cache;
    } else if (len > 0) 
      return this.frame.flat();
  }

  render() {
    let frame, w, v, area;
    // Merge Frame Cache
    frame = this.ghost();
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
