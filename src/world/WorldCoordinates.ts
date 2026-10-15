import { vec2, type Vector2 } from '../core/Vector2';
export const TILE_SIZE = 32;
export interface TileCoordinate { readonly x: number; readonly y: number }
/** Uses floor, not truncation, so negative world coordinates map correctly. */
export function worldToTile(world: Vector2, tileSize = TILE_SIZE): TileCoordinate {
  if (!(tileSize > 0) || !Number.isFinite(tileSize)) throw new RangeError('Tile size must be positive and finite.');
  return { x: Math.floor(world.x / tileSize), y: Math.floor(world.y / tileSize) };
}
export function tileCenter(tile: TileCoordinate, tileSize = TILE_SIZE): Vector2 {
  if (!(tileSize > 0) || !Number.isFinite(tileSize)) throw new RangeError('Tile size must be positive and finite.');
  return vec2((tile.x + 0.5) * tileSize, (tile.y + 0.5) * tileSize);
}
