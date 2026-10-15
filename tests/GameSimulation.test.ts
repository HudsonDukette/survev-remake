import { describe, expect, it } from 'vitest';
import { GameSimulation, PLAYER_RADIUS, PLAYER_SPEED } from '../src/core/GameSimulation';
import type { MovementKey } from '../src/input/InputManager';
import type { Aabb } from '../src/core/Collision2D';

function input(...keys: MovementKey[]) { return { isDown: (key: MovementKey) => keys.includes(key) }; }

describe('GameSimulation', () => {
  it('moves at the configured speed using seconds', () => {
    const game = new GameSimulation();
    game.update(1, input('right'));
    expect(game.playerPosition.x).toBe(PLAYER_SPEED);
    expect(game.playerPosition.y).toBe(0);
  });

  it('normalizes diagonal movement', () => {
    const game = new GameSimulation();
    game.update(1, input('right', 'down'));
    expect(game.playerPosition.x).toBeCloseTo(PLAYER_SPEED / Math.sqrt(2));
    expect(game.playerPosition.y).toBeCloseTo(PLAYER_SPEED / Math.sqrt(2));
  });

  it('does not move without input and rejects invalid dt', () => {
    const game = new GameSimulation();
    game.update(1, input());
    expect(game.playerPosition).toEqual({ x: 0, y: 0 });
    expect(() => game.update(Number.NaN, input())).toThrow(RangeError);
  });

  it('uses collision geometry to stop at obstacles', () => {
    const obstacle: Aabb = { x: 30, y: -30, width: 20, height: 60 };
    const game = new GameSimulation([obstacle]);
    game.update(1, input('right'));
    expect(game.playerPosition.x).toBeLessThanOrEqual(obstacle.x - PLAYER_RADIUS + 0.1);
  });
});
