import { describe, expect, it } from 'vitest';
import { tileCenter, worldToTile } from '../src/world/WorldCoordinates';
import { vec2 } from '../src/core/Vector2';
describe('world coordinates', () => {
  it('uses floor for negative positions', () => { expect(worldToTile(vec2(-0.01, -32))).toEqual({ x: -1, y: -1 }); expect(worldToTile(vec2(31.99, 32))).toEqual({ x: 0, y: 1 }); });
  it('returns tile centers', () => expect(tileCenter({ x: -1, y: 2 }, 32)).toEqual({ x: -16, y: 80 }));
});
