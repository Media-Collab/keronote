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

  snapshot() {

  }

  undo() {

  }

  redo() {

  }
}