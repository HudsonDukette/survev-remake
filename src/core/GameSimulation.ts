import { moveCircle, type Aabb } from './Collision2D';
import { normalize, vec2, type Vector2 } from './Vector2';
import type { InputManager } from '../input/InputManager';

export const PLAYER_SPEED = 180;
export const PLAYER_RADIUS = 9;

export class GameSimulation {
  private position: Vector2 = vec2(0, 0);

  constructor(private readonly obstacles: readonly Aabb[] = []) {}

  get playerPosition(): Vector2 { return vec2(this.position.x, this.position.y); }

  update(dt: number, input: Pick<InputManager, 'isDown'>): void {
    if (!(dt >= 0) || !Number.isFinite(dt)) throw new RangeError('dt must be finite and non-negative.');
    const direction = normalize(vec2(
      Number(input.isDown('right')) - Number(input.isDown('left')),
      Number(input.isDown('down')) - Number(input.isDown('up')),
    ));
    const delta = vec2(direction.x * PLAYER_SPEED * dt, direction.y * PLAYER_SPEED * dt);
    this.position = moveCircle(this.position, delta, PLAYER_RADIUS, this.obstacles);
  }
}
