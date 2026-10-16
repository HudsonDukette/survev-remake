import { describe, expect, it } from 'vitest';
import { SurvivalSimulation, ZOMBIE_MAX_HEALTH } from '../src/core/SurvivalSimulation';
import type { ActionKey, MovementKey } from '../src/input/InputManager';
import type { WorldProp } from '../src/world/WorldMap';

function makeInput(options: { held?: ActionKey[]; pressed?: ActionKey[]; movement?: MovementKey[] } = {}) {
  const pressed = new Set(options.pressed ?? []);
  return {
    isDown: (key: MovementKey) => (options.movement ?? []).includes(key),
    isActionDown: (key: ActionKey) => (options.held ?? []).includes(key),
    consumePressed: (key: ActionKey) => {
      const exists = pressed.has(key);
      pressed.delete(key);
      return exists;
    },
  };
}
const nearbyBuilding: WorldProp = {
  id: 0, kind: 'building', x: -43, y: -50, width: 148, height: 122,
  collision: null, collisions: [], variant: 0,
};

describe('SurvivalSimulation', () => {
  it('starts an endless run with zombies and plenty of supplies', () => {
    const game = new SurvivalSimulation([], []);
    const state = game.snapshot;
    expect(state.health).toBe(100);
    expect(state.zombies).toHaveLength(26);
    expect(state.zombies.every(z => z.active)).toBe(true);
    expect(state.pickups.length).toBeGreaterThanOrEqual(400);
    expect(state.pickups.every(item => item.active)).toBe(true);
    expect(state.wave).toBe(1);
  });
  it('lets the player pulse a nearby zombie and respawns that zombie later', () => {
    const game = new SurvivalSimulation([], []);
    const zombie = game.snapshot.zombies[0]!;
    zombie.x = 28; zombie.y = 0; zombie.health = 30;
    game.update(0.016, makeInput({ held: ['attack'] }));
    expect(game.snapshot.kills).toBe(1);
    expect(zombie.active).toBe(false);
    for (let i = 0; i < 140; i++) game.update(0.1, makeInput());
    expect(zombie.active).toBe(true);
    expect(zombie.health).toBe(ZOMBIE_MAX_HEALTH);
  });
  it('collects nearby supplies and makes them reappear', () => {
    const game = new SurvivalSimulation([], [nearbyBuilding]);
    const medkit = game.snapshot.pickups[0]!;
    medkit.active = false; medkit.respawnTimer = 1000;
    const nearby = game.nearbyPickup;
    expect(nearby).not.toBeNull();
    expect(nearby!.kind).toBe('shield');
    game.update(0.016, makeInput({ pressed: ['interact'] }));
    expect(game.snapshot.suppliesCollected).toBe(1);
    expect(game.snapshot.shield).toBe(55);
    expect(nearby!.active).toBe(false);
    for (let i = 0; i < 250; i++) game.update(0.1, makeInput());
    expect(nearby!.active).toBe(true);
  });
});
