import type { Aabb } from '../core/Collision2D';

export interface WorldProp extends Aabb {
  readonly id: number;
  readonly kind: 'tree' | 'rock';
}

const WORLD_SEED = 0x51a7e;
const WORLD_EXTENT = 1200;
const SPAWN_CLEAR_RADIUS = 175;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable, seed-driven props for the current prototype map. */
export function createWorldProps(): readonly WorldProp[] {
  const random = seededRandom(WORLD_SEED);
  const props: WorldProp[] = [];
  let attempts = 0;

  while (props.length < 110 && attempts < 2000) {
    attempts += 1;
    const kind = props.length < 78 ? 'tree' : 'rock';
    const width = kind === 'tree' ? 28 : 24;
    const height = kind === 'tree' ? 28 : 20;
    const x = Math.round((random() * 2 - 1) * WORLD_EXTENT / 8) * 8;
    const y = Math.round((random() * 2 - 1) * WORLD_EXTENT / 8) * 8;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    if (Math.hypot(centerX, centerY) < SPAWN_CLEAR_RADIUS) continue;

    const candidate: WorldProp = { id: props.length, kind, x, y, width, height };
    const overlaps = props.some((prop) =>
      candidate.x < prop.x + prop.width + 10 &&
      candidate.x + candidate.width + 10 > prop.x &&
      candidate.y < prop.y + prop.height + 10 &&
      candidate.y + candidate.height + 10 > prop.y
    );
    if (!overlaps) props.push(candidate);
  }

  return props;
}

export const WORLD_PROPS = createWorldProps();
