import { KeroContext } from "./context.js";

export class KeroUndo {
  /**
   * 
   * @param {KeroContext} ctx 
   */
  constructor(ctx) {
    this._context = ctx;
    this._canvas = ctx.canvas;
    this._snapshots = [];
  }

  prepare() {
    let canvas, buffer, copy;
    canvas = this._canvas;

    // Current Frame Layer
    buffer = canvas.frame.buffer;
    if (!buffer._undo) {
      copy = new Uint8Array(buffer);
      // Store Current Snapshot
      buffer._undo = [copy];
      buffer._cursor = 0;
    }
  }

  snapshot() {
    let canvas, buffer;
    let copy, cursor;

    canvas = this._canvas;
    // Current Frame Layer
    buffer = canvas.frame.buffer;
    copy = new Uint8Array(buffer);
    // Remove Redo History
    cursor = ++buffer._cursor;
    buffer._undo.splice(cursor);
    // Store Current Snapshot
    buffer._undo.push(copy);
  }

  undo() {
    let canvas, buffer;
    let copy, cursor;

    canvas = this._canvas;
    // Current Frame Layer
    buffer = canvas.frame.buffer;
    cursor = buffer._cursor;
    if (buffer._undo && --cursor >= 0) {
      copy = buffer._undo[cursor];
      // Replace Current Buffer
      buffer.set(copy);
      // Replace Current Index
      buffer._cursor = cursor;

      // Force Rendering
      this._context.render();
    }
  }

  redo() {
    let canvas, buffer;
    let copy, cursor;

    canvas = this._canvas;
    // Current Frame Layer
    buffer = canvas.frame.buffer;
    cursor = buffer._cursor;
    if (buffer._undo && ++cursor < buffer._undo.length) {
      copy = buffer._undo[cursor];
      // Replace Current Buffer
      buffer.set(copy);
      // Replace Current Index
      buffer._cursor = cursor;

      // Force Rendering
      this._context.render();
    }
  }
}