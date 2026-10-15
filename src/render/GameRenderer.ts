import { Application, Container, Graphics } from 'pixi.js';
import { Camera2D } from '../core/Camera2D';
import type { Vector2 } from '../core/Vector2';
import type { WorldProp } from '../world/WorldMap';

/** Procedural rendering using original shapes, ready to replace with permitted art assets. */
export class GameRenderer {
  readonly app = new Application();
  readonly camera = new Camera2D();
  private readonly worldLayer = new Container();
  private readonly ground = new Graphics();
  private readonly grid = new Graphics();
  private readonly props = new Graphics();
  private readonly player = new Graphics();
  private readonly playerRing = new Graphics();
  private initialized = false;

  async init(canvas: HTMLCanvasElement, worldProps: readonly WorldProp[] = []): Promise<void> {
    await this.app.init({
      canvas,
      resizeTo: canvas.parentElement ?? window,
      background: '#789b58',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.app.stage.addChild(this.worldLayer);
    this.worldLayer.addChild(this.ground, this.grid, this.props, this.playerRing, this.player);
    this.drawWorldProps(worldProps);
    this.initialized = true;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private drawWorldProps(worldProps: readonly WorldProp[]): void {
    this.props.clear();
    for (const prop of worldProps) {
      if (prop.kind === 'tree') {
        const cx = prop.x + prop.width / 2;
        const cy = prop.y + prop.height / 2;
        this.props.ellipse(cx + 2, cy + 5, 13, 11).fill({ color: '#273a24', alpha: 0.22 });
        this.props.rect(cx - 3, cy + 1, 6, 11).fill('#73523a');
        this.props.circle(cx, cy - 2, 14).fill('#315f35').stroke({ color: '#24482a', width: 2 });
        this.props.circle(cx - 4, cy - 6, 7).fill({ color: '#4d8242', alpha: 0.8 });
      } else {
        const cx = prop.x + prop.width / 2;
        const cy = prop.y + prop.height / 2;
        this.props.ellipse(cx, cy + 3, 13, 8).fill({ color: '#273a24', alpha: 0.2 });
        this.props.ellipse(cx, cy, 12, 9).fill('#858c7c').stroke({ color: '#51594d', width: 2 });
        this.props.ellipse(cx - 3, cy - 3, 4, 2).fill({ color: '#c3c8b5', alpha: 0.7 });
      }
    }
  }

  private readonly resize = (): void => {
    if (!this.initialized) return;
    this.camera.setViewport(this.app.screen.width, this.app.screen.height);
  };

  render(playerPosition: Vector2): void {
    if (!this.initialized) return;
    this.camera.setCenter(playerPosition);
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const topLeft = this.camera.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.camera.screenToWorld({ x: width, y: height });
    const tile = 32;
    const startX = Math.floor(topLeft.x / tile) * tile;
    const startY = Math.floor(topLeft.y / tile) * tile;

    this.ground.clear().rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y).fill('#789b58');
    this.grid.clear();
    for (let x = startX; x <= bottomRight.x + tile; x += tile) {
      for (let y = startY; y <= bottomRight.y + tile; y += tile) {
        const variation = ((Math.abs(Math.floor(x / tile) * 13 + Math.floor(y / tile) * 29) % 7) - 3) * 0.7;
        this.grid.rect(x + 1, y + 1, tile - 2, tile - 2).fill({ color: variation > 0 ? '#82a35e' : '#729452', alpha: 0.22 });
      }
    }
    this.playerRing.clear().circle(playerPosition.x, playerPosition.y, 12).fill({ color: '#1d2a20', alpha: 0.24 });
    this.player.clear().circle(playerPosition.x, playerPosition.y, 9).fill('#e9d5a2').stroke({ color: '#514333', width: 2 });
    this.worldLayer.position.set(width / 2 - playerPosition.x, height / 2 - playerPosition.y);
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    this.app.destroy(true);
    this.initialized = false;
  }
}
