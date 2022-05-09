import { KeroCanvas } from "./canvas.js";
import { KeroDraw } from "./draw.js";

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
    rect = this.kero.rect;
    x = Math.floor(x / offset.w * rect.w);
    y = Math.floor(y / offset.h * rect.h);
  
    // Return New Point
    return {x: x, y: y};
  }

  render() {
    let kero = this.kero;
    // Flat Each Frame
    kero.render();

    let data, rect, buffer;
    rect = kero.rect;
    // Create New Image Data for Context
    buffer = new Uint8ClampedArray(kero.buffer.buffer);
    console.log(buffer);
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
    let p, draw = this.draw;
    // Testing Proporuses
    draw.tool = Math.floor(Math.random() * 6);
    draw.color = Math.round(Math.random() * 1);
    draw.dither = Math.ceil(Math.random() * 16);
    draw.invert = Math.round(Math.random()) > 0;

    p = this.relative(e);
    if (e.shiftKey) {
      draw.fill(p.x, p.y);
      this.render();
    } else {
      draw.first(p.x, p.y);
      // Bind Events to Window
      window.addEventListener("mousemove", this._cachemove);
      window.addEventListener("mouseup", this._cacheup);
    }
  }

  // -------------------
  // CONTEXT CONSTRUCTOR
  // -------------------

  constructor(canvas) {
    let w, h, ctx = canvas.getContext('2d');

    // Get Canvas Dimensions
    w = canvas.width;
    h = canvas.height;
    // Initialize Keronote Canvas
    this.kero = new KeroCanvas(w, h);
    this.draw = new KeroDraw(this.kero);

    // Store Element
    this._element = canvas;
    this._ctx = ctx;

    // Capture Events
    this._cacheup = (e) => this.onpointerup(e);
    this._cachedown = (e) => this.onpointerdown(e);
    this._cachemove = (e) => this.onpointermove(e);
    canvas.onpointerdown = this._cachedown;
  } 
}