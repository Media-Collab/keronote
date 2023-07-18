import { KeroCanvas } from "./canvas.js";
import { palette } from "./palette.js";

class KeroThumbnail {
  /**
   * 
   * @param {HTMLCanvasElement} dom
   * @param {Uint8Array} buffer
   * @param {number} w
   * @param {number} h
   */
  constructor(dom, buffer, w, h) {
    this._ctx = dom.getContext("2d");
    this._buffer = buffer;
    // Rect Dimensions
    this._w = w;
    this._h = h;
  }

  rasterize() {
    let buffer = this._buffer;
    // Convert Each Pixel Using Palette
    let w, v, area;
    // Buffer Size
    w = this._w;
    v = this._h;
    area = w * v
    let tmp = new Uint32Array(area);

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
      pixel = buffer[o];
      // Get Pixel Mask
      if (odd) 
        pixel >>= 4;
      pixel &= 0xF;
      // Lookup And Apply
      pixel = palette[pixel];
      tmp[i] = pixel;
    }

    // Put Pixels into Canvas
    let tmp1 = new Uint8ClampedArray(tmp.buffer);
    let data = new ImageData(tmp1, this._w, this._h);
    // Scale Image
    createImageBitmap(data).then(bm => {
      let ctx = this._ctx;
      let c = ctx.canvas;
      ctx.drawImage(bm, 0, 0, c.width, c.height);
    });
  }
}

export class KeroPreview {
  /**
   * 
   * @param {KeroCanvas} canvas 
   */
  constructor(canvas) {
    this._canvas = canvas;
    this._lookup = []; 
  }

  /**
   * @param {number} idx
   * @returns {Uint8Array}
   */
  capture(dom, idx) {
    // Check index
    let canvas = this._canvas;
    let frame = canvas.frame;
    let w = canvas._w;
    let h = canvas._h;
    // Map A New Thumbnail
    let thumb = new KeroThumbnail(dom, frame._buffer[idx], w, h);
    this._lookup.push(thumb);
    // Rasterize Thumbnail
    thumb.rasterize();
  }

  update(idx) {
    let canvas = this._canvas;
    let frame = canvas.frame;
    let buffer = frame._buffer[idx];
    // Find Buffer Thumb
    let thumb = this._lookup.find((t => t._buffer == buffer));
    if (thumb)
      thumb.rasterize();
  }

  remove(idx) {
    let canvas = this._canvas;
    let frame = canvas.frame;
    let buffer = frame._buffer[idx];
    // Find Buffer Thumb
    let thumb = this._lookup.findIndex((t => t._buffer == buffer));
    if (thumb > 0)
      this._lookup.splice(thumb, 1);
  }

  clear() {
    // Remove Each Preview
    this._lookup = [];
  }
}