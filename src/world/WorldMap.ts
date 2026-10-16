import type { Aabb } from '../core/Collision2D';

export type WorldPropKind = 'tree' | 'rock' | 'bush' | 'barrel' | 'crate' | 'building';
export interface WorldProp extends Aabb {
  readonly id: number;
  readonly kind: WorldPropKind;
  readonly collision: Aabb | null;
  readonly collisions: readonly Aabb[];
  readonly variant: number;
}
export const WORLD_RADIUS = 7000;
export const SHORE_RADIUS = 7220;
const SPAWN_CLEAR_RADIUS = 205;

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
function buildingWalls(x: number, y: number, width: number, height: number): Aabb[] {
  const wall = 12, halfOpening = 22;
  return [
    { x, y, width, height: wall },
    { x, y: y + wall, width: wall, height: height - wall * 2 },
    { x: x + width - wall, y: y + wall, width: wall, height: height - wall * 2 },
    { x, y: y + height - wall, width: width / 2 - halfOpening, height: wall },
    { x: x + width / 2 + halfOpening, y: y + height - wall, width: width / 2 - halfOpening, height: wall },
  ];
}
export function createWorldProps(): readonly WorldProp[] {
  const random = seededRandom(0x51a7e), props: WorldProp[] = [];
  const counts = { building: 60, tree: 1100, rock: 300, bush: 500, barrel: 80, crate: 90 };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const townCenters = [{x:850,y:520}, ...Array.from({length:12}, (_,i) => {
    const angle = i / 12 * Math.PI * 2 + 0.18;
    const radius = WORLD_RADIUS * (0.42 + (i % 3) * 0.055);
    return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
  })];
  let attempts = 0;
  while (props.length < total && attempts < 36000) {
    attempts++;
    const n = props.length;
    const kind: WorldPropKind = n < counts.building ? 'building'
      : n < counts.building + counts.tree ? 'tree'
      : n < counts.building + counts.tree + counts.rock ? 'rock'
      : n < counts.building + counts.tree + counts.rock + counts.bush ? 'bush'
      : n < total - counts.crate ? 'barrel' : 'crate';
    const width = kind === 'building' ? 148 + Math.floor(random() * 46)
      : kind === 'tree' ? 52 + Math.floor(random() * 13)
      : kind === 'rock' ? 23 + Math.floor(random() * 11)
      : kind === 'bush' ? 26 + Math.floor(random() * 10)
      : kind === 'barrel' ? 21 + Math.floor(random() * 5)
      : 25 + Math.floor(random() * 7);
    const height = kind === 'building' ? 122 + Math.floor(random() * 36)
      : kind === 'tree' ? width * (0.92 + random() * 0.12)
      : kind === 'rock' ? width * (0.72 + random() * 0.28)
      : kind === 'bush' ? width * (0.85 + random() * 0.15)
      : width * (0.92 + random() * 0.08);
    let x: number, y: number;
    if (kind === 'building') {
      const town = townCenters[n % townCenters.length]!;
      x = Math.round((town.x + (random() * 2 - 1) * 340) / 8) * 8;
      y = Math.round((town.y + (random() * 2 - 1) * 300) / 8) * 8;
    } else {
      const range = WORLD_RADIUS - 70;
      x = Math.round(((random() * 2 - 1) * range) / 8) * 8;
      y = Math.round(((random() * 2 - 1) * range) / 8) * 8;
    }
    const cx = x + width / 2, cy = y + height / 2;
    if (Math.hypot(cx, cy) < SPAWN_CLEAR_RADIUS + (kind === 'building' ? 120 : 0)) continue;
    if (Math.hypot(cx, cy) > WORLD_RADIUS - (kind === 'building' ? 175 : 55)) continue;
    if (props.some(p => {
      const pad = kind === 'building' || p.kind === 'building' ? 38 : 13;
      return x < p.x + p.width + pad && x + width + pad > p.x &&
        y < p.y + p.height + pad && y + height + pad > p.y;
    })) continue;
    const collision: Aabb | null = kind === 'building' ? null
      : kind === 'tree' ? { x: cx - 5, y: y + height * 0.65, width: 10, height: 11 }
      : kind === 'rock' ? { x: x + width * 0.13, y: y + height * 0.15, width: width * 0.74, height: height * 0.7 }
      : kind === 'bush' ? null
      : { x: x + width * 0.12, y: y + height * 0.13, width: width * 0.76, height: height * 0.76 };
    props.push({
      id: props.length, kind, x, y, width, height, collision,
      collisions: kind === 'building' ? buildingWalls(x, y, width, height) : collision ? [collision] : [],
      variant: Math.floor(random() * 5),
    });
  }
  return props;
}
export const WORLD_PROPS = createWorldProps();
