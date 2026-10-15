import { Application, Container, Graphics } from 'pixi.js';
import { Camera2D } from '../core/Camera2D';
import type { Vector2 } from '../core/Vector2';
import type { WorldProp } from '../world/WorldMap';

const GRASS = '#80af49';
const GRID = '#527c3e';
const TREE_OUTLINE = '#293f2b';
const TREE_COLORS = ['#2f5d32', '#356737', '#3c7139', '#315b30'];
const BUSH_COLORS = ['#4d7738', '#537f3d', '#467235', '#5b843f'];
const ROCK_COLORS = ['#818b80', '#8f9589', '#777f77', '#989b8b'];

function randomFor(x: number, y: number, salt: number): number {
  let value = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt | 0, 69069);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function canopyPoints(cx: number, cy: number, rx: number, ry: number, variant: number): number[] {
  const points: number[] = [];
  const corners = 14;
  for (let i = 0; i < corners; i += 1) {
    const angle = (Math.PI * 2 * i) / corners;
    const noise = 0.84 + randomFor(variant * 73 + i, variant * 29 - i, 11) * 0.24;
    points.push(cx + Math.cos(angle) * rx * noise, cy + Math.sin(angle) * ry * noise);
  }
  return points;
}

/** Original, procedural top-down art. Keep gameplay hitboxes independent from foliage. */
export class GameRenderer {
  readonly app = new Application();
  readonly camera = new Camera2D();
  private readonly worldLayer = new Container();
  private readonly ground = new Graphics();
  private readonly grassDetails = new Graphics();
  private readonly grid = new Graphics();
  private readonly props = new Graphics();
  private readonly playerRing = new Graphics();
  private readonly player = new Graphics();
  private readonly canopyOverlay = new Graphics();
  private initialized = false;
  private worldProps: readonly WorldProp[] = [];

  async init(canvas: HTMLCanvasElement, worldProps: readonly WorldProp[] = []): Promise<void> {
    await this.app.init({
      canvas,
      resizeTo: canvas.parentElement ?? window,
      background: '#20536e',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.worldProps = worldProps;
    this.app.stage.addChild(this.worldLayer);
    this.worldLayer.addChild(
      this.ground, this.grassDetails, this.grid, this.props,
      this.playerRing, this.player, this.canopyOverlay,
    );
    this.drawWorldProps();
    this.initialized = true;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private drawWorldProps(): void {
    this.props.clear();
    for (const prop of this.worldProps) {
      const cx = prop.x + prop.width / 2;
      const cy = prop.y + prop.height / 2;
      if (prop.kind === 'tree') {
        // The visual canopy is large, but the collision box is only a small trunk.
        this.props.ellipse(cx + 4, prop.y + prop.height * 0.68 + 5, prop.width * 0.48, prop.height * 0.24)
          .fill({ color: '#263b28', alpha: 0.22 });
        this.props.rect(cx - 3.5, prop.y + prop.height * 0.52, 7, prop.height * 0.3)
          .fill('#78533a').stroke({ color: '#4f3b2b', width: 1.5 });
      } else if (prop.kind === 'rock') {
        this.props.ellipse(cx + 2, cy + prop.height * 0.24, prop.width * 0.47, prop.height * 0.31)
          .fill({ color: '#263b28', alpha: 0.2 });
        const shape = [
          prop.x + prop.width * 0.08, cy + prop.height * 0.1,
          prop.x + prop.width * 0.22, prop.y + prop.height * 0.12,
          prop.x + prop.width * 0.7, prop.y + prop.height * 0.06,
          prop.x + prop.width * 0.92, cy - prop.height * 0.02,
          prop.x + prop.width * 0.99, cy + prop.height * 0.36,
          prop.x + prop.width * 0.76, prop.y + prop.height * 0.9,
          prop.x + prop.width * 0.27, prop.y + prop.height * 0.94,
          prop.x + prop.width * 0.03, cy + prop.height * 0.35,
        ];
        this.props.poly(shape).fill(ROCK_COLORS[prop.variant]).stroke({ color: '#4b554b', width: 2 });
        this.props.poly([
          prop.x + prop.width * 0.22, prop.y + prop.height * 0.18,
          prop.x + prop.width * 0.7, prop.y + prop.height * 0.12,
          prop.x + prop.width * 0.48, prop.y + prop.height * 0.42,
          prop.x + prop.width * 0.11, prop.y + prop.height * 0.43,
        ]).fill({ color: '#c7cbb8', alpha: 0.52 });
      } else {
        this.props.ellipse(cx + 1, cy + prop.height * 0.19, prop.width * 0.45, prop.height * 0.25)
          .fill({ color: '#263b28', alpha: 0.15 });
        this.props.poly(canopyPoints(cx, cy, prop.width * 0.47, prop.height * 0.43, prop.variant + prop.id))
          .fill({ color: BUSH_COLORS[prop.variant], alpha: 0.7 })
          .stroke({ color: '#3e6335', width: 1.5, alpha: 0.62 });
        this.props.ellipse(cx - prop.width * 0.12, cy - prop.height * 0.11, prop.width * 0.17, prop.height * 0.11)
          .fill({ color: '#9bbd61', alpha: 0.38 });
      }
    }
  }

  private readonly resize = (): void => {
    if (!this.initialized) return;
    this.camera.setViewport(this.app.screen.width, this.app.screen.height);
  };

  private renderGround(topLeft: Vector2, bottomRight: Vector2): void {
    this.ground.clear()
      .rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y)
      .fill(GRASS);
    this.grassDetails.clear();
    this.grid.clear();

    const tile = 32;
    const startX = Math.floor(topLeft.x / tile);
    const startY = Math.floor(topLeft.y / tile);
    const endX = Math.ceil(bottomRight.x / tile);
    const endY = Math.ceil(bottomRight.y / tile);
    for (let tx = startX; tx <= endX; tx += 1) {
      for (let ty = startY; ty <= endY; ty += 1) {
        const x = tx * tile;
        const y = ty * tile;
        const tone = randomFor(tx, ty, 3);
        if (tone > 0.72) {
          this.grassDetails.rect(x + 3 + tone * 5, y + 4, 7, 2)
            .fill({ color: '#c2d98b', alpha: 0.21 });
        }
        const seed2 = randomFor(tx, ty, 29);
        if (seed2 > 0.37) {
          this.grassDetails.rect(x + 4 + seed2 * 19, y + 9 + tone * 16, 3, 2)
            .fill({ color: '#426f37', alpha: 0.22 });
        }
        if (randomFor(tx, ty, 41) > 0.91) {
          this.grassDetails.ellipse(x + 10 + tone * 12, y + 9 + seed2 * 14, 4, 2)
            .fill({ color: '#a1c36a', alpha: 0.2 });
        }
      }
    }

    // Keep the classic reference's subtle map grid without making every cell a tile border.
    const gridSize = 32;
    const firstX = Math.floor(topLeft.x / gridSize) * gridSize;
    const firstY = Math.floor(topLeft.y / gridSize) * gridSize;
    for (let x = firstX; x <= bottomRight.x + gridSize; x += gridSize) {
      this.grid.moveTo(x, topLeft.y).lineTo(x, bottomRight.y);
    }
    for (let y = firstY; y <= bottomRight.y + gridSize; y += gridSize) {
      this.grid.moveTo(topLeft.x, y).lineTo(bottomRight.x, y);
    }
    this.grid.stroke({ color: GRID, alpha: 0.34, width: 1 });
  }

  private renderCanopies(playerPosition: Vector2): void {
    this.canopyOverlay.clear();
    for (const prop of this.worldProps) {
      if (prop.kind !== 'tree') continue;
      const cx = prop.x + prop.width / 2;
      const cy = prop.y + prop.height / 2;
      const rx = prop.width * 0.48;
      const ry = prop.height * 0.45;
      const isUnderCanopy =
        Math.abs(playerPosition.x - cx) < rx + 8 &&
        Math.abs(playerPosition.y - cy) < ry + 8;
      const alpha = isUnderCanopy ? 0.62 : 0.95;
      this.canopyOverlay.poly(canopyPoints(cx, cy, rx, ry, prop.variant + prop.id))
        .fill({ color: TREE_COLORS[prop.variant], alpha })
        .stroke({ color: TREE_OUTLINE, width: 2.5, alpha: Math.min(0.95, alpha + 0.08) });

      // Inner foliage lobes add depth without importing copied art.
      this.canopyOverlay.circle(cx - rx * 0.35, cy - ry * 0.08, Math.min(rx, ry) * 0.4)
        .fill({ color: '#4c8240', alpha: alpha * 0.82 });
      this.canopyOverlay.circle(cx + rx * 0.27, cy + ry * 0.2, Math.min(rx, ry) * 0.31)
        .fill({ color: '#274d2e', alpha: alpha * 0.72 });
      this.canopyOverlay.ellipse(cx - rx * 0.12, cy - ry * 0.25, rx * 0.25, ry * 0.14)
        .fill({ color: '#8bb45b', alpha: alpha * 0.7 });
    }
  }

  render(playerPosition: Vector2): void {
    if (!this.initialized) return;
    this.camera.setCenter(playerPosition);
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const topLeft = this.camera.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.camera.screenToWorld({ x: width, y: height });
    this.renderGround(topLeft, bottomRight);

    this.playerRing.clear()
      .ellipse(playerPosition.x + 2, playerPosition.y + 6, 12, 7)
      .fill({ color: '#263522', alpha: 0.24 });
    this.player.clear()
      .circle(playerPosition.x, playerPosition.y, 9)
      .fill('#f0d5a0')
      .stroke({ color: '#4a3829', width: 2.2 });
    this.player.circle(playerPosition.x - 2.2, playerPosition.y - 3, 2.5)
      .fill({ color: '#fff0c8', alpha: 0.9 });
    this.renderCanopies(playerPosition);
    this.worldLayer.position.set(width / 2 - playerPosition.x, height / 2 - playerPosition.y);
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    this.app.destroy(true);
    this.initialized = false;
  }
}
