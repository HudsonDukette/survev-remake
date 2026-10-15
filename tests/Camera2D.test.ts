import { describe, expect, it } from 'vitest';
import { Camera2D } from '../src/core/Camera2D';
import { vec2 } from '../src/core/Vector2';
describe('Camera2D', () => {
  it('round-trips coordinates at different zoom levels', () => { const camera = new Camera2D(); camera.setViewport(1280, 720); camera.setCenter(vec2(-120, 45)); camera.setZoom(1.75); const world = vec2(18.5, -91.25); const result = camera.screenToWorld(camera.worldToScreen(world)); expect(result.x).toBeCloseTo(world.x); expect(result.y).toBeCloseTo(world.y); });
  it('maps camera center to viewport center', () => { const camera = new Camera2D(); camera.setViewport(800, 600); camera.setCenter(vec2(99, -25)); expect(camera.worldToScreen(vec2(99, -25))).toEqual({ x: 400, y: 300 }); });
  it('rejects invalid zoom', () => expect(() => new Camera2D().setZoom(0)).toThrow(RangeError));
});
