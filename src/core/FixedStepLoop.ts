export interface FixedStepOptions { readonly stepSeconds?: number; readonly maxFrameSeconds?: number; readonly maxStepsPerFrame?: number }
/** Accumulates variable frame time into deterministic fixed-size simulation updates. */
export class FixedStepLoop {
  readonly stepSeconds: number; readonly maxFrameSeconds: number; readonly maxStepsPerFrame: number;
  private accumulator = 0; private _droppedSeconds = 0;
  constructor(options: FixedStepOptions = {}) {
    this.stepSeconds = options.stepSeconds ?? 1 / 60; this.maxFrameSeconds = options.maxFrameSeconds ?? 0.25; this.maxStepsPerFrame = options.maxStepsPerFrame ?? 8;
    if (!(this.stepSeconds > 0) || !Number.isFinite(this.stepSeconds)) throw new RangeError('stepSeconds must be positive and finite.');
    if (!(this.maxFrameSeconds >= this.stepSeconds) || !Number.isFinite(this.maxFrameSeconds)) throw new RangeError('maxFrameSeconds must be finite and at least one step.');
    if (!Number.isInteger(this.maxStepsPerFrame) || this.maxStepsPerFrame < 1) throw new RangeError('maxStepsPerFrame must be a positive integer.');
  }
  get interpolationAlpha(): number { return this.accumulator / this.stepSeconds; }
  get droppedSeconds(): number { return this._droppedSeconds; }
  advance(frameSeconds: number, update: (dt: number) => void): number {
    if (!Number.isFinite(frameSeconds) || frameSeconds < 0) throw new RangeError('Frame time must be finite and non-negative.');
    const accepted = Math.min(frameSeconds, this.maxFrameSeconds); this._droppedSeconds += frameSeconds - accepted; this.accumulator += accepted;
    let steps = 0;
    while (this.accumulator >= this.stepSeconds && steps < this.maxStepsPerFrame) { update(this.stepSeconds); this.accumulator -= this.stepSeconds; steps++; }
    if (steps === this.maxStepsPerFrame && this.accumulator >= this.stepSeconds) { const retained = this.accumulator % this.stepSeconds; this._droppedSeconds += this.accumulator - retained; this.accumulator = retained; }
    return steps;
  }
  reset(): void { this.accumulator = 0; this._droppedSeconds = 0; }
}
