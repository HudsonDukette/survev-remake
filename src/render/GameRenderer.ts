import { Assets, Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { Camera2D } from '../core/Camera2D';
import type { Vector2 } from '../core/Vector2';
import type { WorldProp } from '../world/WorldMap';
import type { SurvivalSnapshot, LootState, ZombieState } from '../core/SurvivalSimulation';
import { SHORE_RADIUS, WORLD_RADIUS } from '../world/WorldMap';

interface Textures {
  tree: Texture; trunk: Texture; bush: Texture; berry: Texture;
  rocks: Texture[]; barrel: Texture; crate: Texture;
}
interface Canopy { sprite: Sprite; prop: WorldProp }
const CAMERA_ZOOM = 1.55;

export class GameRenderer {
  readonly app = new Application();
  readonly camera = new Camera2D();
  private readonly world = new Container();
  private readonly ground = new Graphics();
  private readonly island = new Graphics();
  private readonly details = new Graphics();
  private readonly grid = new Graphics();
  private readonly river = new Graphics();
  private readonly floors = new Container();
  private readonly props = new Container();
  private readonly dynamic = new Graphics();
  private readonly actor = new Container();
  private readonly body = new Graphics();
  private readonly attackRing = new Graphics();
  private readonly canopyLayer = new Container();
  private initialized = false;
  private worldProps: readonly WorldProp[] = [];
  private canopies: Canopy[] = [];

  async init(canvas: HTMLCanvasElement, worldProps: readonly WorldProp[] = []): Promise<void> {
    await this.app.init({
      canvas, resizeTo: canvas.parentElement ?? window, background: '#438eaa',
      antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.worldProps = worldProps;
    this.camera.setZoom(CAMERA_ZOOM);
    this.props.sortableChildren = true;
    this.canopyLayer.sortableChildren = true;
    const textures = await this.loadTextures();
    this.world.addChild(this.ground, this.island, this.details, this.grid, this.river, this.floors, this.props, this.dynamic, this.canopyLayer);
    this.app.stage.addChild(this.world);
    this.drawIsland();
    this.drawRiver();
    this.drawProps(textures);
    this.drawPlayer();
    this.initialized = true;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private async loadTextures(): Promise<Textures> {
    const root = '/assets/suroi/obstacles/';
    const [tree, trunk, bush, berry, rock1, rock2, rock3, rock4, rock5, barrel, crate] = await Promise.all([
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
    return { tree, trunk, bush, berry, rocks: [rock1, rock2, rock3, rock4, rock5], barrel, crate };
  }

  private sprite(layer: Container, texture: Texture, x: number, y: number, w: number, h: number, z: number, alpha = 1): Sprite {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5); sprite.position.set(x, y); sprite.width = w; sprite.height = h;
    sprite.zIndex = z; sprite.alpha = alpha; layer.addChild(sprite);
    return sprite;
  }
  private drawIsland(): void {
    this.island.ellipse(0, 0, SHORE_RADIUS, SHORE_RADIUS).fill('#d7c58e').stroke({ color: '#71553a', width: 14 });
    this.island.ellipse(0, 0, WORLD_RADIUS, WORLD_RADIUS).fill('#80af49').stroke({ color: '#4b7735', width: 12 });
    for (let i = 0; i < 300; i++) {
      const angle = i / 300 * Math.PI * 2;
      const radius = WORLD_RADIUS + 8 + this.rand(i, i * 7, 81) * 25;
      this.island.ellipse(
        Math.cos(angle) * radius, Math.sin(angle) * radius,
        22 + this.rand(i, i * 3, 24) * 28, 9 + this.rand(i, i * 5, 17) * 18,
      ).fill({ color: i % 3 ? '#739e48' : '#b29e6f', alpha: 0.45 });
    }
  }
  private drawRiver(): void {
    const s = WORLD_RADIUS / 1550;
    const path = (g: Graphics): Graphics => g
      .moveTo(-1540 * s, -430 * s)
      .bezierCurveTo(-1130 * s, -300 * s, -990 * s, 60 * s, -590 * s, 20 * s)
      .bezierCurveTo(-240 * s, -10 * s, -160 * s, -170 * s, 170 * s, -75 * s)
      .bezierCurveTo(520 * s, 20 * s, 620 * s, 265 * s, 1000 * s, 225 * s)
      .bezierCurveTo(1210 * s, 205 * s, 1390 * s, 135 * s, 1550 * s, 100 * s);
    path(this.river).stroke({ color: '#a99569', width: 138, cap: 'round', join: 'round' });
    path(this.river).stroke({ color: '#4e99c0', width: 104, cap: 'round', join: 'round' });
    path(this.river).stroke({ color: '#83c0da', width: 4, alpha: 0.48, cap: 'round' });
  }
  private drawBuilding(p: WorldProp): void {
    const palettes: [string, string, string, string][] = [
      ['#b77b43', '#80532f', '#d0c6a4', '#72503b'], ['#a86b3e', '#71462b', '#c8baa0', '#64452f'],
      ['#b7a67c', '#897850', '#b9c0ac', '#52614b'], ['#c08b4e', '#87562f', '#d4c8a2', '#67462f'],
      ['#9c744f', '#654c37', '#c9c3a6', '#5b4638'],
    ];
    const [floorColor, plank, wall, trim] = palettes[p.variant % palettes.length] ?? palettes[0]!;
    const { x, y, width: w, height: h } = p;
    const floor = new Graphics().rect(x, y, w, h).fill(floorColor);
    for (let yy = y + 10; yy < y + h - 4; yy += 12) floor.moveTo(x + 4, yy).lineTo(x + w - 4, yy);
    floor.stroke({ color: plank, alpha: 0.72, width: 1.4 });
    floor.rect(x + w * 0.22, y + h * 0.27, w * 0.43, h * 0.38).fill({ color: '#6d7a50', alpha: 0.65 }).stroke({ color: '#e0d1a4', width: 3 });
    floor.roundRect(x + w * 0.34, y + h * 0.38, w * 0.28, h * 0.16, 3).fill('#755036').stroke({ color: '#4d3527', width: 3 });
    this.floors.addChild(floor);
    const addWall = (wx: number, wy: number, ww: number, wh: number, z: number): void => {
      const g = new Graphics().rect(wx, wy, ww, wh).fill(wall).stroke({ color: '#473326', width: 3 });
      g.rect(wx + 2, wy + 2, Math.max(0, ww - 4), Math.max(0, wh - 4)).stroke({ color: trim, width: 1.5 });
      g.zIndex = z; this.props.addChild(g);
    };
    addWall(x, y, w, 12, y + 12);
    addWall(x, y + 12, 12, h - 24, y + h * 0.54);
    addWall(x + w - 12, y + 12, 12, h - 24, y + h * 0.54);
    const doorway = 44;
    addWall(x, y + h - 12, w / 2 - doorway / 2, 12, y + h);
    addWall(x + w / 2 + doorway / 2, y + h - 12, w / 2 - doorway / 2, 12, y + h);
    const win = (wx: number, wy: number, ww: number, hh: number, z: number): void => {
      const g = new Graphics().rect(wx, wy, ww, hh).fill('#8ec3cf').stroke({ color: '#55402d', width: 2 });
      g.moveTo(wx + ww / 2, wy).lineTo(wx + ww / 2, wy + hh).stroke({ color: '#d9ded0', width: 2 });
      g.zIndex = z; this.props.addChild(g);
    };
    win(x + w * 0.24, y + 2, w * 0.15, 7, y + 12);
    win(x + w * 0.63, y + 2, w * 0.15, 7, y + 12);
    win(x + 2, y + h * 0.31, 7, h * 0.16, y + h * 0.54);
    win(x + w - 9, y + h * 0.31, 7, h * 0.16, y + h * 0.54);
    const step = new Graphics().rect(x + w / 2 - doorway / 2, y + h - 1, doorway, 15).fill('#c3ab7e').stroke({ color: '#71563c', width: 2 });
    step.zIndex = y + h + 1; this.props.addChild(step);
  }
  private drawProps(t: Textures): void {
    for (const p of this.worldProps) {
      const x = p.x + p.width / 2, y = p.y + p.height / 2, z = p.y + p.height;
      if (p.kind === 'building') { this.drawBuilding(p); continue; }
      if (p.kind === 'tree') {
        this.sprite(this.props, t.trunk, x, p.y + p.height * 0.72, p.width * 0.39, p.height * 0.39, z);
        const leaves = this.sprite(this.canopyLayer, t.tree, x, y - p.height * 0.03, p.width * 1.18, p.height * 1.18, z, 0.98);
        this.canopies.push({ sprite: leaves, prop: p });
      } else if (p.kind === 'rock') this.sprite(this.props, t.rocks[p.variant % t.rocks.length]!, x, y, p.width, p.height, z);
      else if (p.kind === 'bush') this.sprite(this.props, p.variant === 0 ? t.berry : t.bush, x, y, p.width, p.height, z, 0.9);
      else this.sprite(this.props, p.kind === 'barrel' ? t.barrel : t.crate, x, y, p.width, p.height, z);
    }
    this.actor.addChild(this.attackRing, this.body);
    this.props.addChild(this.actor);
  }
  private drawPlayer(): void {
    this.body.roundRect(-12, -4, 7, 10, 2).fill('#72834b').stroke({ color: '#3c4a2e', width: 1.5 });
    this.body.circle(0, 0, 10.5).fill('#f0d1a1').stroke({ color: '#423427', width: 2.2 });
    this.body.circle(-2.2, -3, 3.2).fill('#fff0c8').circle(2.4, -3, 2.1).fill('#dba86d');
    this.body.roundRect(-5, 5, 4, 5, 1.5).fill('#333b2c').roundRect(2, 5, 4, 5, 1.5).fill('#333b2c');
  }
  private readonly resize = (): void => { if (this.initialized) this.camera.setViewport(this.app.screen.width, this.app.screen.height); };
  private rand(x: number, y: number, salt: number): number {
    let value = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt | 0, 69069);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }
  private renderGround(a: Vector2, b: Vector2): void {
    this.ground.clear().rect(a.x, a.y, b.x - a.x, b.y - a.y).fill('#438eaa');
    this.details.clear(); this.grid.clear();
    const tile = 64;
    for (let tx = Math.floor(a.x / tile); tx <= Math.ceil(b.x / tile); tx++) {
      for (let ty = Math.floor(a.y / tile); ty <= Math.ceil(b.y / tile); ty++) {
        const x = tx * tile, y = ty * tile, cx = x + tile / 2, cy = y + tile / 2;
        const distance = Math.hypot(cx, cy), tone = this.rand(tx, ty, 3), seed = this.rand(tx, ty, 29);
        if (distance < WORLD_RADIUS - 26) {
          if (tone > 0.62) this.details.ellipse(cx + tone * 12 - 6, cy + seed * 12 - 6, 16 + tone * 23, 9 + seed * 14)
            .fill({ color: tone > 0.87 ? '#a5c96e' : tone > 0.76 ? '#648d3d' : '#507d39', alpha: 0.14 + tone * 0.07 });
          if (seed > 0.4) this.details.ellipse(x + 8 + seed * 38, y + 10 + tone * 40, 3, 2).fill({ color: '#426d35', alpha: 0.28 });
          if (this.rand(tx, ty, 41) > 0.94) this.details.ellipse(x + 14 + tone * 24, y + 15 + seed * 24, 6, 3).fill({ color: '#b7ce79', alpha: 0.36 });
          if (this.rand(tx, ty, 63) > 0.985) this.details.ellipse(cx, cy, 24, 15).fill({ color: '#c1ad76', alpha: 0.22 });
        }
      }
    }
    const tileGrid = 360, firstX = Math.floor(a.x / tileGrid) * tileGrid, firstY = Math.floor(a.y / tileGrid) * tileGrid;
    for (let x = firstX; x <= b.x + tileGrid; x += tileGrid) {
      if (Math.abs(x) >= WORLD_RADIUS) continue;
      const edge = Math.sqrt(WORLD_RADIUS * WORLD_RADIUS - x * x), top = Math.max(a.y, -edge), bottom = Math.min(b.y, edge);
      if (bottom > top) this.grid.moveTo(x, top).lineTo(x, bottom);
    }
    for (let y = firstY; y <= b.y + tileGrid; y += tileGrid) {
      if (Math.abs(y) >= WORLD_RADIUS) continue;
      const edge = Math.sqrt(WORLD_RADIUS * WORLD_RADIUS - y * y), left = Math.max(a.x, -edge), right = Math.min(b.x, edge);
      if (right > left) this.grid.moveTo(left, y).lineTo(right, y);
    }
    this.grid.stroke({ color: '#527c3e', alpha: 0.18, width: 1.5 });
  }
  private drawZombie(zombie: ZombieState): void {
    const { x, y, health, hitFlash } = zombie;
    this.dynamic.ellipse(x + 3, y + 9, 17, 8).fill({ color: '#1c2b20', alpha: 0.3 });
    this.dynamic.roundRect(x - 11, y - 3, 22, 22, 7).fill(hitFlash > 0 ? '#e6e9b5' : '#638d48').stroke({ color: '#2d4a2b', width: 2 });
    this.dynamic.circle(x, y - 9, 13).fill(hitFlash > 0 ? '#f5f0cc' : '#83a85a').stroke({ color: '#2d4a2b', width: 2 });
    this.dynamic.circle(x - 4.5, y - 10, 2.1).fill('#d65e4c');
    this.dynamic.circle(x + 4.5, y - 10, 2.1).fill('#d65e4c');
    this.dynamic.moveTo(x - 4, y - 3).lineTo(x + 4, y - 3).stroke({ color: '#33442d', width: 2 });
    this.dynamic.roundRect(x - 17, y + 1, 7, 15, 3).fill('#6d9650').stroke({ color: '#2d4a2b', width: 1.3 });
    this.dynamic.roundRect(x + 10, y + 1, 7, 15, 3).fill('#6d9650').stroke({ color: '#2d4a2b', width: 1.3 });
    this.dynamic.roundRect(x - 7, y + 15, 5, 8, 2).fill('#394c31');
    this.dynamic.roundRect(x + 2, y + 15, 5, 8, 2).fill('#394c31');
    this.dynamic.roundRect(x - 14, y - 29, 28, 4, 2).fill({ color: '#172116', alpha: 0.78 });
    this.dynamic.rect(x - 13, y - 28, 26 * Math.max(0, health) / 82, 2).fill('#e16e59');
  }
  private drawPickup(item: LootState, elapsed: number): void {
    const { x, y, kind } = item, pulse = Math.sin(elapsed * 4 + item.id) * 1.5;
    this.dynamic.ellipse(x + 1, y + 9, 12, 6).fill({ color: '#263323', alpha: 0.28 });
    if (kind === 'medical') {
      this.dynamic.roundRect(x - 10 - pulse * 0.2, y - 10 - pulse * 0.2, 20 + pulse * 0.4, 20 + pulse * 0.4, 4).fill('#f6f1d9').stroke({ color: '#9e604c', width: 2 });
      this.dynamic.rect(x - 2.4, y - 7, 4.8, 14).fill('#dc5148');
      this.dynamic.rect(x - 7, y - 2.4, 14, 4.8).fill('#dc5148');
    } else if (kind === 'shield') {
      this.dynamic.poly([x, y - 13 - pulse, x + 12, y - 7, x + 9, y + 6, x, y + 13, x - 9, y + 6, x - 12, y - 7]).fill('#70b5d7').stroke({ color: '#2d5c77', width: 2 });
      this.dynamic.poly([x, y - 7, x + 6, y - 4, x + 4, y + 4, x, y + 8, x - 4, y + 4, x - 6, y - 4]).fill({ color: '#d4f1fa', alpha: 0.68 });
    } else {
      this.dynamic.poly([x - 3, y - 13 - pulse, x + 6, y - 3, x + 1, y - 1, x + 4, y + 11, x - 7, y - 1, x - 2, y - 3]).fill('#f4ce63').stroke({ color: '#8c6e33', width: 2 });
    }
  }
  render(state: SurvivalSnapshot): void {
    if (!this.initialized) return;
    const p = state.playerPosition, old = this.camera.getCenter();
    const center = { x: old.x + (p.x - old.x) * 0.18, y: old.y + (p.y - old.y) * 0.18 };
    this.camera.setCenter(center);
    const width = this.app.screen.width, height = this.app.screen.height;
    const topLeft = this.camera.screenToWorld({ x: 0, y: 0 }), bottomRight = this.camera.screenToWorld({ x: width, y: height });
    this.renderGround(topLeft, bottomRight);
    this.world.scale.set(this.camera.getZoom());
    this.world.position.set(width / 2 - center.x * this.camera.getZoom(), height / 2 - center.y * this.camera.getZoom());
    this.actor.position.set(p.x, p.y);
    this.actor.zIndex = Math.round(p.y + 15);
    this.actor.alpha = state.respawnTimer > 0 ? 0.36 : state.invulnerabilityTimer > 0 && Math.floor(state.survivalSeconds * 18) % 2 === 0 ? 0.48 : 1;
    this.attackRing.clear();
    if (state.attackTimer > 0) {
      const progress = 1 - state.attackTimer / 0.19;
      this.attackRing.circle(0, 0, 32 + progress * 64).stroke({ color: '#fff0ad', width: 4, alpha: Math.max(0.1, 1 - progress) });
    }
    for (const canopy of this.canopies) {
      const cx = canopy.prop.x + canopy.prop.width / 2, cy = canopy.prop.y + canopy.prop.height / 2;
      canopy.sprite.alpha = Math.hypot(p.x - cx, p.y - cy) < Math.max(canopy.prop.width, canopy.prop.height) * 0.72 ? 0.46 : 0.98;
    }
    this.dynamic.clear();
    const margin = 100;
    for (const item of state.pickups) {
      if (!item.active || item.x < topLeft.x - margin || item.x > bottomRight.x + margin || item.y < topLeft.y - margin || item.y > bottomRight.y + margin) continue;
      this.drawPickup(item, state.survivalSeconds);
    }
    for (const zombie of state.zombies) {
      if (!zombie.active || zombie.x < topLeft.x - margin || zombie.x > bottomRight.x + margin || zombie.y < topLeft.y - margin || zombie.y > bottomRight.y + margin) continue;
      this.drawZombie(zombie);
    }
  }
  destroy(): void { window.removeEventListener('resize', this.resize); this.app.destroy(true); this.initialized = false; }
}
