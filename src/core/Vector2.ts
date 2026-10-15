/** Immutable-by-convention world-space vector. Units are world units, not screen pixels. */
export interface Vector2 { readonly x: number; readonly y: number }
export function vec2(x = 0, y = 0): Vector2 {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new RangeError('Vector coordinates must be finite numbers.');
  return { x, y };
}
export function add(a: Vector2, b: Vector2): Vector2 { return vec2(a.x + b.x, a.y + b.y); }
export function subtract(a: Vector2, b: Vector2): Vector2 { return vec2(a.x - b.x, a.y - b.y); }
export function scale(v: Vector2, amount: number): Vector2 {
  if (!Number.isFinite(amount)) throw new RangeError('Scale must be finite.');
  return vec2(v.x * amount, v.y * amount);
}
export function length(v: Vector2): number { return Math.hypot(v.x, v.y); }
export function normalize(v: Vector2): Vector2 { const magnitude = length(v); return magnitude === 0 ? vec2() : scale(v, 1 / magnitude); }
export function distance(a: Vector2, b: Vector2): number { return length(subtract(a, b)); }
