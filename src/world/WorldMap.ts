import type { Aabb } from '../core/Collision2D';

export interface WorldProp extends Aabb {
  readonly id: number;
  readonly kind: 'tree' | 'rock' | 'bush';
  /** Collision is deliberately separate from the visual sprite bounds. */
  readonly collision: Aabb | null;
  readonly variant: number;
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

/** Stable original tree, rock, and bush placements for the prototype's green biome. */
export function createWorldProps(): readonly WorldProp[] {
  const random = seededRandom(WORLD_SEED);
  const props: WorldProp[] = [];
  const desiredCounts = { tree: 68, rock: 22, bush: 34 };
  const total = desiredCounts.tree + desiredCounts.rock + desiredCounts.bush;
  let attempts = 0;

  while (props.length < total && attempts < 5000) {
    attempts += 1;
    const next = props.length;
    const kind: WorldProp['kind'] =
      next < desiredCounts.tree ? 'tree'
        : next < desiredCounts.tree + desiredCounts.rock ? 'rock'
          : 'bush';

    const width = kind === 'tree'
      ? 34 + Math.floor(random() * 13)
      : kind === 'rock'
        ? 18 + Math.floor(random() * 12)
        : 19 + Math.floor(random() * 14);
    const height = kind === 'tree'
      ? width * (0.82 + random() * 0.22)
      : kind === 'rock'
        ? width * (0.68 + random() * 0.35)
        : width * (0.65 + random() * 0.3);
    const x = Math.round(((random() * 2 - 1) * WORLD_EXTENT) / 8) * 8;
    const y = Math.round(((random() * 2 - 1) * WORLD_EXTENT) / 8) * 8;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    if (Math.hypot(centerX, centerY) < SPAWN_CLEAR_RADIUS) continue;

    const collision: Aabb | null = kind === 'tree'
      ? { x: centerX - 5, y: y + height * 0.55, width: 10, height: 11 }
      : kind === 'rock'
        ? { x: x + width * 0.13, y: y + height * 0.15, width: width * 0.74, height: height * 0.7 }
        : null;

    const candidate: WorldProp = {
      id: props.length,
      kind,
      x,
      y,
      width,
      height,
      collision,
      variant: Math.floor(random() * 4),
    };
    const overlaps = props.some((prop) =>
      candidate.x < prop.x + prop.width + 16 &&
      candidate.x + candidate.width + 16 > prop.x &&
      candidate.y < prop.y + prop.height + 16 &&
      candidate.y + candidate.height + 16 > prop.y
    );
    if (!overlaps) props.push(candidate);
  }

  return props;
}

export const WORLD_PROPS = createWorldProps();
