import { describe, expect, it } from 'vitest';
import { circleIntersectsAabb, moveCircle, type Aabb } from '../src/core/Collision2D';
import { vec2 } from '../src/core/Vector2';

const wall: Aabb = { x: 10, y: -20, width: 4, height: 40 };

describe('Collision2D', () => {
  it('detects circle/rectangle overlap and separation', () => {
    expect(circleIntersectsAabb(vec2(8, 0), 2, wall)).toBe(true);
    expect(circleIntersectsAabb(vec2(7.9, 0), 2, wall)).toBe(false);
    expect(circleIntersectsAabb(vec2(8, -22), 2, wall)).toBe(true);
  });

  it('blocks movement through a wall, even for a large requested delta', () => {
    const result = moveCircle(vec2(0, 0), vec2(30, 0), 2, [wall]);
    expect(result.x).toBeLessThanOrEqual(8);
    expect(result.y).toBe(0);
  });

  it('allows sliding along a wall while blocking the blocked axis', () => {
    const result = moveCircle(vec2(0, 0), vec2(30, 12), 2, [wall]);
    expect(result.x).toBeLessThanOrEqual(8);
    expect(result.y).toBeGreaterThan(0);
    expect(result.y).toBeCloseTo(12);
  });

  it('rejects movement from an invalid overlapping start and validates radius', () => {
    expect(moveCircle(vec2(11, 0), vec2(5, 0), 2, [wall])).toEqual(vec2(11, 0));
    expect(() => moveCircle(vec2(), vec2(1, 0), 0, [])).toThrow(RangeError);
  });

  it('rejects malformed obstacle dimensions', () => {
    expect(() => circleIntersectsAabb(vec2(), 1, { x: 0, y: 0, width: -1, height: 2 })).toThrow(RangeError);
  });
});
