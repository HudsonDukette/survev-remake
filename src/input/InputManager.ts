export type MovementKey = 'up' | 'down' | 'left' | 'right';
export type ActionKey = 'attack' | 'interact';

const KEY_MAP: Readonly<Record<string, MovementKey | undefined>> = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};
const ACTION_MAP: Readonly<Record<string, ActionKey | undefined>> = {
  Space: 'attack', KeyE: 'interact',
};

export class InputManager {
  private readonly held = new Set<MovementKey>();
  private readonly heldActions = new Set<ActionKey>();
  private readonly pressedActions = new Set<ActionKey>();
  private attached = false;
  private readonly downHandler = (event: KeyboardEvent): void => {
    const movement = KEY_MAP[event.code];
    if (movement) { event.preventDefault(); this.held.add(movement); return; }
    const action = ACTION_MAP[event.code];
    if (action) {
      event.preventDefault();
      if (!this.heldActions.has(action)) this.pressedActions.add(action);
      this.heldActions.add(action);
    }
  };
  private readonly upHandler = (event: KeyboardEvent): void => {
    const movement = KEY_MAP[event.code];
    if (movement) { event.preventDefault(); this.held.delete(movement); return; }
    const action = ACTION_MAP[event.code];
    if (action) { event.preventDefault(); this.heldActions.delete(action); }
  };
  private readonly blurHandler = (): void => this.clear();

  attach(target: Window = window): void {
    if (this.attached) return;
    target.addEventListener('keydown', this.downHandler);
    target.addEventListener('keyup', this.upHandler);
    target.addEventListener('blur', this.blurHandler);
    this.attached = true;
  }
  detach(target: Window = window): void {
    if (!this.attached) return;
    target.removeEventListener('keydown', this.downHandler);
    target.removeEventListener('keyup', this.upHandler);
    target.removeEventListener('blur', this.blurHandler);
    this.clear();
    this.attached = false;
  }
  isDown(key: MovementKey): boolean { return this.held.has(key); }
  isActionDown(key: ActionKey): boolean { return this.heldActions.has(key); }
  consumePressed(key: ActionKey): boolean {
    const pressed = this.pressedActions.has(key);
    this.pressedActions.delete(key);
    return pressed;
  }
  clear(): void { this.held.clear(); this.heldActions.clear(); this.pressedActions.clear(); }
}
