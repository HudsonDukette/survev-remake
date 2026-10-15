import { vec2, type Vector2 } from './Vector2';

export interface Aabb {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function validateRect(rect: Aabb): void {
  if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
      rect.width < 0 || rect.height < 0) {
    throw new RangeError('Rectangle coordinates and dimensions must be finite; dimensions cannot be negative.');
  }
}

function validateRadius(radius: number): void {
  if (!(radius > 0) || !Number.isFinite(radius)) {
    throw new RangeError('Circle radius must be positive and finite.');
  }
}

/** Exact circle-vs-axis-aligned-rectangle overlap test, including edge contact. */
export function circleIntersectsAabb(center: Vector2, radius: number, rect: Aabb): boolean {
  validateRadius(radius);
  validateRect(rect);
  const nearestX = Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(center.y, rect.y + rect.height));
  const dx = center.x - nearestX;
  const dy = center.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Moves a circular actor through static AABB obstacles. Substeps prevent tunnelling
 * at ordinary game movement speeds; resolving X and Y independently allows wall sliding.
 * If the starting position overlaps an obstacle, movement is rejected rather than
 * attempting an unpredictable depenetration.
 */
export function moveCircle(
  start: Vector2,
  delta: Vector2,
  radius: number,
  obstacles: readonly Aabb[],
): Vector2 {
  validateRadius(radius);
  for (const obstacle of obstacles) validateRect(obstacle);
  if (obstacles.some((obstacle) => circleIntersectsAabb(start, radius, obstacle))) {
    return vec2(start.x, start.y);
  }

  const largestDelta = Math.max(Math.abs(delta.x), Math.abs(delta.y));
  const stepLength = Math.max(1, radius * 0.5);
  const steps = Math.max(1, Math.ceil(largestDelta / stepLength));
  const stepX = delta.x / steps;
  const stepY = delta.y / steps;
  let position = vec2(start.x, start.y);

  for (let i = 0; i < steps; i += 1) {
    const nextX = vec2(position.x + stepX, position.y);
    if (!obstacles.some((obstacle) => circleIntersectsAabb(nextX, radius, obstacle))) {
      position = nextX;
    }
    const nextY = vec2(position.x, position.y + stepY);
    if (!obstacles.some((obstacle) => circleIntersectsAabb(nextY, radius, obstacle))) {
      position = nextY;
    }
  }
  return position;
}
