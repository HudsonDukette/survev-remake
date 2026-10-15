import { describe, expect, it } from 'vitest';
import { createWorldProps } from '../src/world/WorldMap';

describe('WorldMap', () => {
  it('generates stable, non-empty obstacle placement', () => {
    expect(createWorldProps()).toEqual(createWorldProps());
    expect(createWorldProps().length).toBeGreaterThan(80);
  });

  it('keeps the spawn area clear and uses valid obstacle dimensions', () => {
    const props = createWorldProps();
    expect(props.every((prop) => prop.width > 0 && prop.height > 0)).toBe(true);
    expect(props.every((prop) => Math.hypot(prop.x + prop.width / 2, prop.y + prop.height / 2) >= 175)).toBe(true);
  });
});
