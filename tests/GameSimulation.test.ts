import { describe, expect, it } from 'vitest';
import { GameSimulation } from '../src/core/GameSimulation';
import type { MovementKey } from '../src/input/InputManager';
function input(...keys: MovementKey[]) { return { isDown: (key: MovementKey) => keys.includes(key) }; }
describe('GameSimulation', () => {
  it('moves at the configured speed using seconds', () => { const game = new GameSimulation(); game.update(1, input('right')); expect(game.playerPosition.x).toBe(180); expect(game.playerPosition.y).toBe(0); });
  it('normalizes diagonal movement', () => { const game = new GameSimulation(); game.update(1, input('right', 'down')); expect(game.playerPosition.x).toBeCloseTo(180 / Math.sqrt(2)); expect(game.playerPosition.y).toBeCloseTo(180 / Math.sqrt(2)); });
  it('does not move without input and rejects invalid dt', () => { const game = new GameSimulation(); game.update(1, input()); expect(game.playerPosition).toEqual({ x: 0, y: 0 }); expect(() => game.update(Number.NaN, input())).toThrow(RangeError); });
});
