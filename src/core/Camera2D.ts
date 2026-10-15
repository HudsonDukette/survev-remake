import { vec2, type Vector2 } from './Vector2';
/** Camera transforms between world units and canvas CSS-pixel coordinates. */
export class Camera2D {
  private center: Vector2 = vec2(); private viewportWidth = 1; private viewportHeight = 1; private zoom = 1;
  setViewport(width: number, height: number): void {
    if (!(width > 0) || !(height > 0) || !Number.isFinite(width + height)) throw new RangeError('Viewport dimensions must be positive and finite.');
    this.viewportWidth = width; this.viewportHeight = height;
  }
  setCenter(center: Vector2): void { this.center = vec2(center.x, center.y); }
  getCenter(): Vector2 { return vec2(this.center.x, this.center.y); }
  setZoom(zoom: number): void { if (!(zoom > 0) || !Number.isFinite(zoom)) throw new RangeError('Zoom must be positive and finite.'); this.zoom = zoom; }
  getZoom(): number { return this.zoom; }
  worldToScreen(world: Vector2): Vector2 { return vec2((world.x - this.center.x) * this.zoom + this.viewportWidth / 2, (world.y - this.center.y) * this.zoom + this.viewportHeight / 2); }
  screenToWorld(screen: Vector2): Vector2 { return vec2((screen.x - this.viewportWidth / 2) / this.zoom + this.center.x, (screen.y - this.viewportHeight / 2) / this.zoom + this.center.y); }
}
