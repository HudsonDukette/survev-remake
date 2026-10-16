import { moveCircle, type Aabb } from './Collision2D';
import { normalize, vec2, type Vector2 } from './Vector2';
import type { InputManager } from '../input/InputManager';
import { WORLD_RADIUS } from '../world/WorldMap';

export const PLAYER_SPEED = 190;
export const PLAYER_RADIUS = 10;

export class GameSimulation {
  private position: Vector2 = vec2(0, 0);
  constructor(private readonly obstacles: readonly Aabb[] = [], private readonly worldRadius = WORLD_RADIUS) {}
  get playerPosition(): Vector2 { return vec2(this.position.x, this.position.y); }
  update(dt: number, input: Pick<InputManager, 'isDown'>): void {
    if (!(dt >= 0) || !Number.isFinite(dt)) throw new RangeError('dt must be finite and non-negative.');
    const direction = normalize(vec2(Number(input.isDown('right')) - Number(input.isDown('left')), Number(input.isDown('down')) - Number(input.isDown('up'))));
    const delta = vec2(direction.x * PLAYER_SPEED * dt, direction.y * PLAYER_SPEED * dt);
    const moved = moveCircle(this.position, delta, PLAYER_RADIUS, this.obstacles);
    const maxRadius = Math.max(0, this.worldRadius - PLAYER_RADIUS);
    const distance = Math.hypot(moved.x, moved.y);
    this.position = distance > maxRadius ? vec2(moved.x * maxRadius / distance, moved.y * maxRadius / distance) : moved;
  }
}
