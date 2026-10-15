export type MovementKey = 'up' | 'down' | 'left' | 'right';
const KEY_MAP: Readonly<Record<string, MovementKey | undefined>> = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
/** Tracks held movement keys; it never owns or mutates game state. */
export class InputManager {
  private readonly held = new Set<MovementKey>();
  private readonly downHandler = (event: KeyboardEvent): void => { const movement = KEY_MAP[event.code]; if (movement) { event.preventDefault(); this.held.add(movement); } };
  private readonly upHandler = (event: KeyboardEvent): void => { const movement = KEY_MAP[event.code]; if (movement) { event.preventDefault(); this.held.delete(movement); } };
  private readonly blurHandler = (): void => this.clear(); private attached = false;
  attach(target: Window = window): void { if (this.attached) return; target.addEventListener('keydown', this.downHandler); target.addEventListener('keyup', this.upHandler); target.addEventListener('blur', this.blurHandler); this.attached = true; }
  detach(target: Window = window): void { if (!this.attached) return; target.removeEventListener('keydown', this.downHandler); target.removeEventListener('keyup', this.upHandler); target.removeEventListener('blur', this.blurHandler); this.clear(); this.attached = false; }
  isDown(key: MovementKey): boolean { return this.held.has(key); }
  clear(): void { this.held.clear(); }
}
