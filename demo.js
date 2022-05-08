import { KeroCanvas, KeroDraw } from "./src/index.js"
var kero = new KeroCanvas(640, 463);
var draw = new KeroDraw(kero);
draw.size = 2;
draw.dither = 15;
draw.color = 0;
draw.invert = false;

let c = document.getElementById('keronote');
let ctx = c.getContext('2d');
var offset = {x: 0, y: 0, w: 0, h: 0};

// ------------
// MOUSE EVENTS
// ------------

function relative(e) {
  let x, y, rect;
  // Mouse position
  x = e.clientX - offset.x;
  y = e.clientY - offset.y;
  // Ajust Aspect Ratio
  rect = kero.rect;
  x = Math.floor(x / offset.w * rect.w);
  y = Math.floor(y / offset.h * rect.h);

  // Return New Point
  return {x: x, y: y};
}

function canvas_render() {
  kero.render();

  let data, rect, buffer;
  rect = kero.rect;
  buffer = new Uint8ClampedArray(kero.buffer.buffer);
  data = new ImageData(buffer, rect.w, rect.h);

  ctx.putImageData(data, 0, 0);
}

function canvas_pointermove(e) {
  let p = relative(e);
  draw.push(p.x, p.y);
  draw.dispatch();

  canvas_render();
  // Prevent Default
  e.preventDefault();
}

function canvas_pointerup() {
  window.removeEventListener("mousemove", canvas_pointermove);
  window.removeEventListener("mouseup", canvas_pointerup);
  document.body.style.cursor = "default";
}

c.onpointerdown = e => {
  let bound = e.target.getBoundingClientRect();
  offset.x = bound.left;
  offset.y = bound.top;
  offset.w = bound.width;
  offset.h = bound.height;

  //draw.color = (draw.color + 1) & 15;
  //draw.dither = (draw.dither + 1) & 15;
  draw.color = Math.floor(Math.random() * 16);
  draw.dither = Math.ceil(Math.random() * 16);
  draw.invert = Math.round(Math.random()) > 0;
  //draw.invert = !draw.invert;

  let p = relative(e);
  if (e.shiftKey) {
    draw.fill(p.x, p.y);
    canvas_render();
  } else {
    draw.first(p.x, p.y);
    // Bind Events to Window
    window.addEventListener("mousemove", canvas_pointermove);
    window.addEventListener("mouseup", canvas_pointerup);
  }

}
