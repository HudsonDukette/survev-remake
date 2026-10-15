import { describe, expect, it } from 'vitest';
import { add, distance, normalize, scale, vec2 } from '../src/core/Vector2';
describe('Vector2', () => {
  it('adds and scales coordinates', () => { expect(add(vec2(2, -1), vec2(3, 5))).toEqual({ x: 5, y: 4 }); expect(scale(vec2(2, 3), 2)).toEqual({ x: 4, y: 6 }); });
  it('normalizes without changing direction', () => { expect(normalize(vec2(3, 4))).toEqual({ x: 0.6, y: 0.8 }); expect(normalize(vec2())).toEqual({ x: 0, y: 0 }); });
  it('rejects non-finite coordinates and measures distance', () => { expect(() => vec2(Number.NaN, 0)).toThrow(RangeError); expect(distance(vec2(0, 0), vec2(3, 4))).toBe(5); });
});
