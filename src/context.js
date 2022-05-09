import { KeroCanvas } from "./canvas.js";
import { KeroDraw } from "./draw.js";
import { KeroPlayer } from "./player.js";

export class KeroContext {
  get offset() {
    let bound = this._element.getBoundingClientRect();

    return {
      x: bound.left,
      y: bound.top,
      w: bound.width,
      h: bound.height
    };
  }

  relative(e) {
    let x, y, rect, offset;
    offset = this.offset;

    // Mouse position
    x = e.clientX - offset.x;
    y = e.clientY - offset.y;
    // Ajust Aspect Ratio
    rect = this.canvas.rect;
    x = Math.floor(x / offset.w * rect.w);
    y = Math.floor(y / offset.h * rect.h);
  
    // Return New Point
    return {x: x, y: y};
  }

  render() {
    let canvas = this.canvas;
    // Flat Each Frame
    canvas.render();

    let data, rect, buffer;
    rect = canvas.rect;
    // Create New Image Data for Context
    buffer = new Uint8ClampedArray(canvas.buffer.buffer);
    data = new ImageData(buffer, rect.w, rect.h);
    // Upload Image to Context
    this._ctx.putImageData(data, 0, 0);
  }

  // --------------
  // POINTER EVENTS
  // --------------

  onpointermove(e) {
    let p, draw;

    p = this.relative(e);
    draw = this.draw;
    draw.push(p.x, p.y);
    draw.dispatch();
  
    this.render();
    // Prevent Default
    e.preventDefault();
  }

  onpointerup(e) {
    window.removeEventListener("mousemove", this._cachemove);
    window.removeEventListener("mouseup", this._cacheup);
    document.body.style.cursor = "default";

    // End Drawing
    this.draw.finally();
  }

  onpointerdown(e) {
    if (this.lock) return;
    let p, draw = this.draw;

    p = this.relative(e);
    draw.first(p.x, p.y);

    if (draw.tool < 6) {
      window.addEventListener("mousemove", this._cachemove);
      window.addEventListener("mouseup", this._cacheup);
    } else {
      draw.finally();
      this.render();
    }
  }

  // -------------------
  // CONTEXT CONSTRUCTOR
  // -------------------

  constructor(canvas) {
    let w, h, ctx = canvas.getContext('2d');

    this.lock = false;
    // Get Canvas Dimensions
    w = canvas.width;
    h = canvas.height;
    // Store Element
    this._element = canvas;
    this._ctx = ctx;
    // Initialize Keronote Canvas
    this.canvas = new KeroCanvas(w, h);
    this.draw = new KeroDraw(this.canvas);
    this.player = new KeroPlayer(this);

    // Capture Events
    this._cacheup = (e) => this.onpointerup(e);
    this._cachedown = (e) => this.onpointerdown(e);
    this._cachemove = (e) => this.onpointermove(e);
    canvas.onpointerdown = this._cachedown;
  } 
}
