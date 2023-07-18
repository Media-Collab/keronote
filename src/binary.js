// import { pako } from "pako";
import { KeroContext } from "./context.js"

export class KeroBinary {
  /**
   * 
   * @param {KeroContext} ctx 
   */
  constructor(ctx) {
    this._ctx = ctx;
  }

  size() {
    let canvas, frames, total = 0;
    canvas = this._ctx.canvas;
    frames = canvas.frames();

    for (let frame of frames) {
      let buffers = frame.buffers();
      for (let layer of buffers) {
        total += layer.byteLength;
      }
    }

    // Return Total of Bytes
    return total;
  }

  /**
   * 
   * @param {Blob} blob 
   * @returns {Promise}
   */
  async load(blob) {
    let canvas = this._ctx.canvas;

    return blob.arrayBuffer().then((buffer) => {
      let head = buffer.slice(0, 8);
      head = new Uint32Array(head);
      // Get Buffer Sizes
      let buffer0, buffer1;
      buffer0 = head[0];
      buffer1 = head[1];

      // Clear Canvas
      canvas.empty();
      // Lookup Two Buffers
      buffer1 = buffer.slice(8 + buffer0);
      buffer0 = buffer.slice(8, 8 + buffer0);
      // Convert to Buffers
      buffer0 = new TextDecoder().decode(buffer0);
      buffer0 = JSON.parse(buffer0);
      buffer1 = new Uint8Array(buffer1);

      let offset, bytes, chunk;
      for (let frame of buffer0) {
        canvas.insert();
        let cursor = canvas.frame;
        cursor.empty();

        for (let layer of frame) {
          offset = layer.offset;
          bytes = layer.bytes;
          // Replace Buffer Content
          chunk = buffer1.slice(offset, offset + bytes);
          cursor.push(chunk);
        }

        // Reset Frame Current
        cursor.current = 0;
      }

      // Reset Canvas Current
      canvas.current = 0;
      // Force Rendering
      this._ctx.render();
    });
  }

  /**
   * 
   * @returns {Blob}
   */
  save() {
    let size, buffer1, buffer0, blob;
    // Allocate Accumulated Buffer Size
    size = this.size();
    buffer1 = new Uint8Array(size);
    buffer0 = [];

    // Frames Iterator
    let canvas, frames;
    canvas = this._ctx.canvas;
    frames = canvas.frames();

    let json, offset = 0, bytes;
    for (let frame of frames) {
      json = [];

      let buffers = frame.buffers();
      for (let layer of buffers) {
        // Arrange Packed Buffer
        bytes = layer.byteLength;
        buffer1.set(layer, offset, offset + bytes);
        // Indentify Layer
        json.push({
          offset: offset,
          bytes: bytes
        });
        // Next Buffer
        offset += bytes;
      }
      // Add Frame Description
      buffer0.push(json);
    }

    buffer0 = JSON.stringify(buffer0);
    buffer0 = new TextEncoder().encode(buffer0);
    // Create Header With Sizes
    let head = new Uint32Array(2);
    head[0] = buffer0.byteLength;
    head[1] = buffer1.byteLength;
    head = new Uint8Array(head.buffer);
    // Merge and Compress With Pako
    offset = head.byteLength;
    offset += buffer0.byteLength;
    offset += buffer1.byteLength;
    let merged = new Uint8Array(offset);

    // Merge Buffers
    offset = 0;
    merged.set(head, offset);
    offset += head.byteLength;
    merged.set(buffer0, offset);
    offset += buffer0.byteLength;
    merged.set(buffer1, offset);
    // Compress Buffer
    // merged = pako.deflate(merged);

    // Create New Binary Blob
    blob = new Blob([merged], 
      {type: "application/octet-stream"});

    // Return New Blob
    return blob;
  }
}
