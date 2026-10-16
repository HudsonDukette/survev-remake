import { Assets, Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { Camera2D } from '../core/Camera2D';
import type { Vector2 } from '../core/Vector2';
import type { WorldProp } from '../world/WorldMap';

const GRASS = '#80af49';
const GRID = '#527c3e';

interface EnvironmentTextures {
  readonly treeLeaves: Texture;
  readonly treeTrunk: Texture;
  readonly bush: Texture;
  readonly blueberryBush: Texture;
  readonly rocks: readonly Texture[];
  readonly barrel: Texture;
  readonly crate: Texture;
}

interface CanopySprite {
  readonly sprite: Sprite;
  readonly prop: WorldProp;
}

/** PixiJS renderer using the separately credited Suroi environment SVGs. */
export class GameRenderer {
  readonly app = new Application();
  readonly camera = new Camera2D();
  private readonly worldLayer = new Container();
  private readonly ground = new Graphics();
  private readonly grassDetails = new Graphics();
  private readonly grid = new Graphics();
  private readonly propLayer = new Container();
  private readonly playerRing = new Graphics();
  private readonly player = new Graphics();
  private readonly canopyLayer = new Container();
  private initialized = false;
  private worldProps: readonly WorldProp[] = [];
  private canopies: CanopySprite[] = [];

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
    const textures = await this.loadEnvironmentTextures();

    this.propLayer.sortableChildren = true;
    this.canopyLayer.sortableChildren = true;
    this.app.stage.addChild(this.worldLayer);
    this.worldLayer.addChild(
      this.ground, this.grassDetails, this.grid, this.propLayer,
      this.playerRing, this.player, this.canopyLayer,
    );
    this.drawWorldProps(textures);
    this.initialized = true;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private async loadEnvironmentTextures(): Promise<EnvironmentTextures> {
    const root = '/assets/suroi/obstacles/';
    const [
      treeLeaves, treeTrunk, bush, blueberryBush,
      rock1, rock2, rock3, rock4, rock5, barrel, crate,
    ] = await Promise.all([
      Assets.load<Texture>(root + 'pine_tree/pine_tree.svg'),
      Assets.load<Texture>(root + 'pine_tree/pine_tree_trunk.svg'),
      Assets.load<Texture>(root + 'bush/bush.svg'),
      Assets.load<Texture>(root + 'blueberry_bush/blueberry_bush.svg'),
      Assets.load<Texture>(root + 'rock/rock_1.svg'),
      Assets.load<Texture>(root + 'rock/rock_2.svg'),
      Assets.load<Texture>(root + 'rock/rock_3.svg'),
      Assets.load<Texture>(root + 'rock/rock_4.svg'),
      Assets.load<Texture>(root + 'rock/rock_5.svg'),
      Assets.load<Texture>(root + 'barrel/barrel.svg'),
      Assets.load<Texture>(root + 'regular_crate/regular_crate.svg'),
    ]);
    return {
      treeLeaves, treeTrunk, bush, blueberryBush,
      rocks: [rock1, rock2, rock3, rock4, rock5],
      barrel, crate,
    };
  }

  private addSprite(
    layer: Container,
    texture: Texture,
    x: number,
    y: number,
    width: number,
    height: number,
    zIndex: number,
    alpha = 1,
  ): Sprite {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    sprite.width = width;
    sprite.height = height;
    sprite.zIndex = zIndex;
    sprite.alpha = alpha;
    layer.addChild(sprite);
    return sprite;
  }

  private drawWorldProps(textures: EnvironmentTextures): void {
    this.propLayer.removeChildren();
    this.canopyLayer.removeChildren();
    this.canopies = [];

    for (const prop of this.worldProps) {
      const cx = prop.x + prop.width / 2;
      const cy = prop.y + prop.height / 2;
      const z = Math.round(prop.y + prop.height);

      if (prop.kind === 'tree') {
        // The trunk is drawn below the player; the foliage is drawn above and fades nearby.
        this.addSprite(
          this.propLayer, textures.treeTrunk, cx, prop.y + prop.height * 0.72,
          prop.width * 0.39, prop.height * 0.39, z,
        );
        const leaves = this.addSprite(
          this.canopyLayer, textures.treeLeaves, cx, cy - prop.height * 0.03,
          prop.width * 1.18, prop.height * 1.18, z, 0.98,
        );
        this.canopies.push({ sprite: leaves, prop });
      } else if (prop.kind === 'rock') {
        this.addSprite(
          this.propLayer, textures.rocks[prop.variant % textures.rocks.length],
          cx, cy, prop.width, prop.height, z,
        );
      } else if (prop.kind === 'bush') {
        const texture = prop.variant === 0 ? textures.blueberryBush : textures.bush;
        this.addSprite(
          this.propLayer, texture, cx, cy, prop.width, prop.height, z, 0.87,
        );
      } else if (prop.kind === 'barrel') {
        this.addSprite(this.propLayer, textures.barrel, cx, cy, prop.width, prop.height, z);
      } else {
        this.addSprite(this.propLayer, textures.crate, cx, cy, prop.width, prop.height, z);
      }
    }
  }

  private readonly resize = (): void => {
    if (!this.initialized) return;
    this.camera.setViewport(this.app.screen.width, this.app.screen.height);
  };

  private randomFor(x: number, y: number, salt: number): number {
    let value = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt | 0, 69069);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }

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
        const tone = this.randomFor(tx, ty, 3);
        if (tone > 0.72) {
          this.grassDetails.rect(x + 3 + tone * 5, y + 4, 7, 2)
            .fill({ color: '#c2d98b', alpha: 0.21 });
        }
        const seed2 = this.randomFor(tx, ty, 29);
        if (seed2 > 0.37) {
          this.grassDetails.rect(x + 4 + seed2 * 19, y + 9 + tone * 16, 3, 2)
            .fill({ color: '#426f37', alpha: 0.22 });
        }
        if (this.randomFor(tx, ty, 41) > 0.91) {
          this.grassDetails.ellipse(x + 10 + tone * 12, y + 9 + seed2 * 14, 4, 2)
            .fill({ color: '#a1c36a', alpha: 0.2 });
        }
      }
    }

    const firstX = Math.floor(topLeft.x / tile) * tile;
    const firstY = Math.floor(topLeft.y / tile) * tile;
    for (let x = firstX; x <= bottomRight.x + tile; x += tile) {
      this.grid.moveTo(x, topLeft.y).lineTo(x, bottomRight.y);
    }
    for (let y = firstY; y <= bottomRight.y + tile; y += tile) {
      this.grid.moveTo(topLeft.x, y).lineTo(bottomRight.x, y);
    }
    this.grid.stroke({ color: GRID, alpha: 0.34, width: 1 });
  }

  private updateCanopyTransparency(playerPosition: Vector2): void {
    for (const canopy of this.canopies) {
      const { prop, sprite } = canopy;
      const cx = prop.x + prop.width / 2;
      const cy = prop.y + prop.height / 2;
      const distance = Math.hypot(playerPosition.x - cx, playerPosition.y - cy);
      sprite.alpha = distance < Math.max(prop.width, prop.height) * 0.72 ? 0.47 : 0.98;
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
    this.updateCanopyTransparency(playerPosition);
    this.worldLayer.position.set(width / 2 - playerPosition.x, height / 2 - playerPosition.y);
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    this.app.destroy(true);
    this.initialized = false;
  }
}
