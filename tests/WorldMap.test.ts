import { describe, expect, it } from 'vitest';
import { createWorldProps } from '../src/world/WorldMap';

describe('WorldMap', () => {
  it('generates the same prop placement every time', () => {
    expect(createWorldProps()).toEqual(createWorldProps());
  });

  it('includes a mix of trees, rocks, passable bushes, barrels, and crates', () => {
    const props = createWorldProps();
    expect(props.length).toBeGreaterThan(90);
    for (const kind of ['tree', 'rock', 'bush', 'barrel', 'crate'] as const) {
      expect(props.some((prop) => prop.kind === kind)).toBe(true);
    }
    expect(props.some((prop) => prop.kind === 'bush' && prop.collision === null)).toBe(true);
  });

  it('keeps the spawn area clear and gives trees a smaller trunk hitbox', () => {
    const props = createWorldProps();
    expect(props.every((prop) => prop.width > 0 && prop.height > 0)).toBe(true);
    expect(props.every((prop) => Math.hypot(prop.x + prop.width / 2, prop.y + prop.height / 2) >= 175)).toBe(true);
    const tree = props.find((prop) => prop.kind === 'tree');
    expect(tree?.collision).not.toBeNull();
    expect(tree!.collision!.width).toBeLessThan(tree!.width);
    expect(tree!.collision!.height).toBeLessThan(tree!.height);
  });

  it('gives solid props collisions while bushes stay passable', () => {
    const props = createWorldProps();
    for (const kind of ['rock', 'barrel', 'crate'] as const) {
      expect(props.find((prop) => prop.kind === kind)?.collision).not.toBeNull();
    }
    expect(props.find((prop) => prop.kind === 'bush')?.collision).toBeNull();
  });
});
