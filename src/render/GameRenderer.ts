import { Application, Container, Graphics } from 'pixi.js';
import { Camera2D } from '../core/Camera2D';
import type { Vector2 } from '../core/Vector2';
/** Temporary procedural rendering for milestone 1; replace with permitted art assets later. */
export class GameRenderer {
  readonly app = new Application(); readonly camera = new Camera2D(); private readonly worldLayer = new Container(); private readonly ground = new Graphics(); private readonly grid = new Graphics(); private readonly player = new Graphics(); private readonly playerRing = new Graphics(); private initialized = false;
  async init(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({ canvas, resizeTo: canvas.parentElement ?? window, background: '#789b58', antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2) });
    this.app.stage.addChild(this.worldLayer); this.worldLayer.addChild(this.ground, this.grid, this.playerRing, this.player); this.initialized = true; this.resize(); window.addEventListener('resize', this.resize);
  }
  private readonly resize = (): void => { if (!this.initialized) return; this.camera.setViewport(this.app.screen.width, this.app.screen.height); };
  render(playerPosition: Vector2): void {
    if (!this.initialized) return; this.camera.setCenter(playerPosition); const width = this.app.screen.width; const height = this.app.screen.height;
    const topLeft = this.camera.screenToWorld({ x: 0, y: 0 }); const bottomRight = this.camera.screenToWorld({ x: width, y: height }); const tile = 32;
    const startX = Math.floor(topLeft.x / tile) * tile; const startY = Math.floor(topLeft.y / tile) * tile;
    this.ground.clear().rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y).fill('#789b58'); this.grid.clear();
    for (let x = startX; x <= bottomRight.x + tile; x += tile) for (let y = startY; y <= bottomRight.y + tile; y += tile) {
      const variation = ((Math.abs(Math.floor(x / tile) * 13 + Math.floor(y / tile) * 29) % 7) - 3) * 0.7;
      this.grid.rect(x + 1, y + 1, tile - 2, tile - 2).fill({ color: variation > 0 ? '#82a35e' : '#729452', alpha: 0.22 });
    }
    this.playerRing.clear().circle(playerPosition.x, playerPosition.y, 12).fill({ color: '#1d2a20', alpha: 0.24 });
    this.player.clear().circle(playerPosition.x, playerPosition.y, 9).fill('#e9d5a2').stroke({ color: '#514333', width: 2 });
    this.worldLayer.position.set(width / 2 - playerPosition.x, height / 2 - playerPosition.y);
  }
  destroy(): void { window.removeEventListener('resize', this.resize); this.app.destroy(true); this.initialized = false; }
}
