import { describe, expect, it } from 'vitest';
import { FixedStepLoop } from '../src/core/FixedStepLoop';
describe('FixedStepLoop', () => {
  it('converts variable frame time into fixed updates', () => { const loop = new FixedStepLoop({ stepSeconds: 0.1, maxFrameSeconds: 0.5, maxStepsPerFrame: 8 }); const updates: number[] = []; expect(loop.advance(0.25, (dt) => updates.push(dt)).toBe(2); expect(updates).toEqual([0.1, 0.1]); expect(loop.interpolationAlpha).toBeCloseTo(0.5); });
  it('caps long pauses and records dropped time', () => { const loop = new FixedStepLoop({ stepSeconds: 0.1, maxFrameSeconds: 0.25, maxStepsPerFrame: 8 }); let steps = 0; loop.advance(2, () => steps++); expect(steps).toBe(2); expect(loop.droppedSeconds).toBeCloseTo(1.75); });
  it('rejects invalid elapsed time', () => { const loop = new FixedStepLoop(); expect(() => loop.advance(-1, () => undefined)).toThrow(RangeError); });
});
