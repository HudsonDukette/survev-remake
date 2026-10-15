import { normalize, vec2, type Vector2 } from './Vector2';
import type { InputManager } from '../input/InputManager';
export const PLAYER_SPEED = 180;
export class GameSimulation {
  private position: Vector2 = vec2(0, 0);
  get playerPosition(): Vector2 { return vec2(this.position.x, this.position.y); }
  update(dt: number, input: Pick<InputManager, 'isDown'>): void {
    if (!(dt >= 0) || !Number.isFinite(dt)) throw new RangeError('dt must be finite and non-negative.');
    const direction = normalize(vec2(Number(input.isDown('right')) - Number(input.isDown('left')), Number(input.isDown('down')) - Number(input.isDown('up'))));
    this.position = vec2(this.position.x + direction.x * PLAYER_SPEED * dt, this.position.y + direction.y * PLAYER_SPEED * dt);
  }
}
