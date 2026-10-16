import type { Aabb } from '../core/Collision2D';

export type WorldPropKind = 'tree' | 'rock' | 'bush' | 'barrel' | 'crate';

export interface WorldProp extends Aabb {
  readonly id: number;
  readonly kind: WorldPropKind;
  /** Collision is deliberately independent from the visible sprite bounds. */
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

/** Stable world layout populated with the attributed Suroi environment sprite pack. */
export function createWorldProps(): readonly WorldProp[] {
  const random = seededRandom(WORLD_SEED);
  const props: WorldProp[] = [];
  const desiredCounts = { tree: 48, rock: 23, bush: 28, barrel: 5, crate: 7 };
  const total = Object.values(desiredCounts).reduce((sum, count) => sum + count, 0);
  let attempts = 0;

  while (props.length < total && attempts < 6000) {
    attempts += 1;
    const next = props.length;
    const kind: WorldPropKind =
      next < desiredCounts.tree ? 'tree'
        : next < desiredCounts.tree + desiredCounts.rock ? 'rock'
          : next < desiredCounts.tree + desiredCounts.rock + desiredCounts.bush ? 'bush'
            : next < desiredCounts.tree + desiredCounts.rock + desiredCounts.bush + desiredCounts.barrel ? 'barrel'
              : 'crate';

    const width = kind === 'tree'
      ? 52 + Math.floor(random() * 13)
      : kind === 'rock'
        ? 23 + Math.floor(random() * 11)
        : kind === 'bush'
          ? 26 + Math.floor(random() * 10)
          : kind === 'barrel'
            ? 21 + Math.floor(random() * 5)
            : 25 + Math.floor(random() * 7);
    const height = kind === 'tree'
      ? width * (0.92 + random() * 0.12)
      : kind === 'rock'
        ? width * (0.72 + random() * 0.28)
        : kind === 'bush'
          ? width * (0.85 + random() * 0.15)
          : width * (0.92 + random() * 0.08);
    const x = Math.round(((random() * 2 - 1) * WORLD_EXTENT) / 8) * 8;
    const y = Math.round(((random() * 2 - 1) * WORLD_EXTENT) / 8) * 8;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    if (Math.hypot(centerX, centerY) < SPAWN_CLEAR_RADIUS) continue;

    const collision: Aabb | null =
      kind === 'tree'
        ? { x: centerX - 5, y: y + height * 0.65, width: 10, height: 11 }
        : kind === 'rock'
          ? { x: x + width * 0.13, y: y + height * 0.15, width: width * 0.74, height: height * 0.7 }
          : kind === 'bush'
            ? null
            : { x: x + width * 0.12, y: y + height * 0.13, width: width * 0.76, height: height * 0.76 };

    const candidate: WorldProp = {
      id: props.length,
      kind,
      x,
      y,
      width,
      height,
      collision,
      variant: Math.floor(random() * 5),
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
