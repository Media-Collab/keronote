import { KeroContext } from "./context.js";

export class KeroPlayer {
  /**
   * 
   * @param {KeroContext} ctx
   */
  constructor(ctx) {
    // Player Status
    this._speed = 64;
    this._loop = false;
    this._playing = false;
    this._backwards = false;
    // Context Status
    this._context = ctx;
    this._canvas = ctx.canvas;
  }

  playing() {
    return this._playing && this._timeout;
  }

  speed(ms) {
    if (ms > 16)
      this._speed = ms;
  }

  next() {
    let canvas, size, current;
    // Lookup Size and Current
    canvas = this._canvas;
    size = canvas.length;
    current = canvas.current + 1;
    // Check if can next
    if (current >= size) {
      if (this._playing && this._loop)
        current = 0;
      else current = size - 1;
    }

    // Replace Current Frame
    this._canvas.current = current;
  }

  prev() {
    let canvas, size, current;
    // Lookup Size and Current
    canvas = this._canvas;
    size = canvas.length;
    current = canvas.current - 1;
    // Check if can prev
    if (current < 0) {
      if (this._playing && this._loop)
        current = size - 1;
      else current = 0;
    }

    // Replace Current Frame
    this._canvas.current = current;
  }

  tick() {
    let ctx, canvas;
    ctx = this._context;
    canvas = this._canvas;

    // Next or Prev Frame
    if (this._backwards)
      this.prev();
    else this.next();
    // Render Frame
    canvas.render();
    ctx.render();
  }

  play(backwards, loop) {
    if (!this._playing) {
      this._lock = this._context.lock;
      this._current = this._canvas.current;

      this._context.lock = true;
      // Create Backwards Timeout
      this._backwards = backwards;
      this._loop = loop;

      // Play Using Timeout
      this._playing = true;
      this._timeout = setInterval(
        () => this.tick(), this._speed);
    }
  }

  stop(restore) {
    if (this._playing) {
      // Stop Current Timeout
      this._playing = false;
      clearInterval(this._timeout);

      if (restore)
        this._canvas.current = this._current;
      this._context.lock = this._lock;
      // Delete Callback
      delete this._timeout;
    }
  }
}
