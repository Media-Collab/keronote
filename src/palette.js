// ----------------
// 16 COLOR PALETTE
// ----------------

export const palette = [
  0x00000000, // None
  0xff000000, // Black
  0xff7f7f7f, // Gray
  0xffffffff, // White
  0xff1010ff, // Red
  0xffc426ec, // Magenta
  0xffdb37a0, // Purple
  0xffce3900, // Blue
  0xffcdb814, // Aqua
  0xffbad826, // Teal
  0xff318400, // Dark Green
  0xff5ddb65, // Light Green
  0xff17b886, // Grass Green
  0xff00e7ff, // Yellow
  0xff0784ff, // Orange
  0xff204981  // Brown
];

// ----------------
// DITHERING OBJECT
// ----------------

export class KeroDither {
  constructor(w, h, buffer) {
    this._w = w;
    this._h = h;
    // Save Current Buffer
    this._buffer = buffer;
  }

  lookup(x, y) {
    let w, h, check;
    w = this._w;
    h = this._h;
    // Warp Dithering
    x = x % w;
    y = y % h;

    return this._buffer[y * w + x];
  }

  inverted(x, y) {
    let c = this.lookup(x, y);
    return c <= 0;
  }

  check(x, y) {
    let c = this.lookup(x, y);
    return c > 0;
  }
}

// ---------------
// DITHERING ARRAY
// ---------------

var dithers = [];

function add_dither(w, h, buffer) {
  let d = new KeroDither(w, h, buffer);
  dithers.push(d);
}

// --------------
// DITHERING MASK
// --------------

add_dither(2, 2, [
  1, 0,
  0, 0 
]);

add_dither(2, 2, [
  1, 0,
  0, 1
]);

add_dither(2, 2, [
  1, 0,
  1, 0
]);

add_dither(2, 2, [
  1, 1,
  0, 0
]);

add_dither(3, 3, [
  1, 0, 0,
  0, 0, 0,
  0, 0, 0
]);

add_dither(3, 3, [
  0, 1, 0,
  1, 1, 1,
  0, 1, 0
]);

add_dither(3, 3, [
  1, 0, 1,
  0, 1, 0,
  1, 0, 1
]);

add_dither(3, 3, [
  1, 0, 0,
  0, 0, 0,
  0, 0, 1
]);

add_dither(3, 3, [
  0, 0, 1,
  0, 0, 0,
  1, 0, 0
]);

add_dither(4, 4, [
  0, 0, 1, 0,
  1, 0, 0, 0,
  0, 0, 0, 1,
  0, 1, 0, 0
]);

add_dither(5, 5, [
  0, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 0, 1, 0,
  0, 0, 0, 0, 0
]);

add_dither(5, 5, [
  0, 0, 0, 0, 0,
  0, 0, 0, 1, 0,
  0, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 0, 0, 0
]);

add_dither(5, 5, [
  0, 0, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 1, 1, 1, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 0, 0
]);

add_dither(5, 5, [
  0, 0, 0, 0, 0,
  0, 1, 0, 1, 0,
  0, 0, 1, 0, 0,
  0, 1, 0, 1, 0,
  0, 0, 0, 0, 0
]);

add_dither(5, 5, [
  1, 0, 0, 1, 0,
  0, 1, 0, 0, 1,
  0, 0, 1, 0, 0,
  1, 0, 0, 1, 0,
  0, 1, 0, 0, 1
]);

add_dither(5, 5, [
  0, 1, 0, 0, 1,
  1, 0, 0, 1, 0,
  0, 0, 1, 0, 0,
  0, 1, 0, 0, 1,
  1, 0, 0, 1, 0
]);

// Export Dithering
export { dithers };