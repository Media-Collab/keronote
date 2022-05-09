import { KeroContext } from "./context";

export class KeroUndo {
  /**
   * 
   * @param {KeroContext} ctx 
   */
  constructor(ctx) {
    this._context = ctx;
    this._canvas = ctx.canvas;
  }
}