import { moveCircle, type Aabb } from './Collision2D';
import { normalize, vec2, type Vector2 } from './Vector2';
import type { InputManager } from '../input/InputManager';
import { WORLD_RADIUS, WORLD_PROPS, type WorldProp } from '../world/WorldMap';

export const PLAYER_RADIUS = 10;
export const PLAYER_SPEED = 205;
export const PLAYER_MAX_HEALTH = 100;
export const ZOMBIE_MAX_HEALTH = 82;
export const ZOMBIE_ATTACK_RANGE = 31;
export const MELEE_RANGE = 96;
export type LootKind = 'medical' | 'shield' | 'boost';
type SurvivalInput = Pick<InputManager, 'isDown' | 'isActionDown' | 'consumePressed'>;

export interface ZombieState {
  readonly id: number;
  x: number; y: number; health: number; active: boolean;
  respawnTimer: number; attackCooldown: number; wanderTimer: number; wanderAngle: number; hitFlash: number;
}
export interface LootState {
  readonly id: number; readonly kind: LootKind; readonly x: number; readonly y: number;
  active: boolean; respawnTimer: number;
}
export interface SurvivalSnapshot {
  readonly playerPosition: Vector2;
  readonly health: number; readonly shield: number; readonly kills: number; readonly deaths: number;
  readonly suppliesCollected: number; readonly survivalSeconds: number; readonly wave: number;
  readonly attackTimer: number; readonly invulnerabilityTimer: number; readonly respawnTimer: number;
  readonly boostTimer: number; readonly zombies: readonly ZombieState[]; readonly pickups: readonly LootState[];
  readonly notice: string; readonly noticeTimer: number;
}

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
function clampToIsland(position: Vector2): Vector2 {
  const maxRadius = WORLD_RADIUS - PLAYER_RADIUS - 10;
  const distance = Math.hypot(position.x, position.y);
  return distance > maxRadius && distance > 0
    ? vec2(position.x * maxRadius / distance, position.y * maxRadius / distance)
    : position;
}

/** Endless single-player loop with respawning supplies, pursuing zombies, escalating waves, and automatic revives. */
export class SurvivalSimulation {
  private readonly randomSource = seededRandom(0xa13c7e);
  private readonly zombies: ZombieState[] = [];
  private readonly pickups: LootState[] = [];
  private player: Vector2 = vec2();
  private health = PLAYER_MAX_HEALTH;
  private shield = 25;
  private kills = 0;
  private deaths = 0;
  private suppliesCollected = 0;
  private elapsed = 0;
  private announcedWave = 1;
  private attackCooldown = 0;
  private attackTimer = 0;
  private invulnerabilityTimer = 1.5;
  private respawnTimer = 0;
  private boostTimer = 0;
  private noticeText = 'STAY ALERT — SOMETHING IS MOVING OUT THERE';
  private noticeTimer = 5;
  private nextZombieId = 1;
  private nextPickupId = 1;
  private readonly obstacles: readonly Aabb[];
  private readonly worldProps: readonly WorldProp[];

  constructor(obstacles: readonly Aabb[], worldProps: readonly WorldProp[] = WORLD_PROPS) {
    this.obstacles = obstacles;
    this.worldProps = worldProps;
    this.createPickups();
    for (let i = 0; i < 26; i++) {
      const point = this.spawnPoint(i < 18 ? 400 : 900, i < 18 ? 1450 : WORLD_RADIUS * 0.84);
      this.zombies.push({
        id: this.nextZombieId++, x: point.x, y: point.y, health: ZOMBIE_MAX_HEALTH,
        active: true, respawnTimer: 0, attackCooldown: this.random() * 0.8,
        wanderTimer: this.random() * 2, wanderAngle: this.random() * Math.PI * 2, hitFlash: 0,
      });
    }
  }

  private random(): number { return this.randomSource(); }
  private pickLootKind(): LootKind {
    const n = this.random();
    return n < 0.46 ? 'medical' : n < 0.78 ? 'shield' : 'boost';
  }
  private addPickup(x: number, y: number, kind = this.pickLootKind()): void {
    this.pickups.push({ id: this.nextPickupId++, kind, x, y, active: true, respawnTimer: 0 });
  }
  private createPickups(): void {
    for (const building of this.worldProps.filter(prop => prop.kind === 'building')) {
      this.addPickup(building.x + building.width * 0.29, building.y + building.height * 0.42, 'medical');
      this.addPickup(building.x + building.width * 0.60, building.y + building.height * 0.50, 'shield');
      this.addPickup(building.x + building.width * 0.47, building.y + building.height * 0.74, 'boost');
    }
    let attempts = 0, localPlaced = 0;
    const target = 460;
    while (this.pickups.length < target && attempts < 8000) {
      attempts++;
      const angle = this.random() * Math.PI * 2;
      const radius = localPlaced < 90 ? 330 + this.random() * 1550 : Math.sqrt(this.random()) * (WORLD_RADIUS - 280);
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (this.obstacles.some(obstacle =>
        x >= obstacle.x - 20 && x <= obstacle.x + obstacle.width + 20 &&
        y >= obstacle.y - 20 && y <= obstacle.y + obstacle.height + 20
      )) continue;
      this.addPickup(x, y);
      localPlaced++;
    }
  }
  private nearbyObstacles(point: Vector2, padding: number): Aabb[] {
    return this.obstacles.filter(obstacle =>
      obstacle.x + obstacle.width >= point.x - padding && obstacle.x <= point.x + padding &&
      obstacle.y + obstacle.height >= point.y - padding && obstacle.y <= point.y + padding
    );
  }
  private pointClear(point: Vector2, radius: number): boolean {
    return !this.obstacles.some(obstacle => {
      const closestX = Math.max(obstacle.x, Math.min(point.x, obstacle.x + obstacle.width));
      const closestY = Math.max(obstacle.y, Math.min(point.y, obstacle.y + obstacle.height));
      return (point.x - closestX) ** 2 + (point.y - closestY) ** 2 < radius ** 2;
    });
  }
  private spawnPoint(minDistance: number, maxDistance: number): Vector2 {
    for (let i = 0; i < 55; i++) {
      const angle = this.random() * Math.PI * 2;
      const distance = minDistance + this.random() * Math.max(1, maxDistance - minDistance);
      const candidate = clampToIsland(vec2(this.player.x + Math.cos(angle) * distance, this.player.y + Math.sin(angle) * distance));
      if (this.pointClear(candidate, 26)) return candidate;
    }
    const angle = this.random() * Math.PI * 2;
    return clampToIsland(vec2(this.player.x + Math.cos(angle) * minDistance, this.player.y + Math.sin(angle) * minDistance));
  }
  get nearbyPickup(): LootState | null {
    let best: LootState | null = null, bestDistance = 68;
    for (const item of this.pickups) {
      if (!item.active) continue;
      const distance = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (distance < bestDistance) { best = item; bestDistance = distance; }
    }
    return best;
  }
  get snapshot(): SurvivalSnapshot {
    return {
      playerPosition: vec2(this.player.x, this.player.y), health: this.health, shield: this.shield,
      kills: this.kills, deaths: this.deaths, suppliesCollected: this.suppliesCollected,
      survivalSeconds: this.elapsed, wave: 1 + Math.floor(this.elapsed / 75),
      attackTimer: this.attackTimer, invulnerabilityTimer: this.invulnerabilityTimer,
      respawnTimer: this.respawnTimer, boostTimer: this.boostTimer,
      zombies: this.zombies, pickups: this.pickups, notice: this.noticeText, noticeTimer: this.noticeTimer,
    };
  }
  private showNotice(text: string, duration = 2.2): void { this.noticeText = text; this.noticeTimer = duration; }
  private collectNearbyPickup(): void {
    const item = this.nearbyPickup;
    if (!item) { this.showNotice('NO SUPPLIES IN REACH', 1.2); return; }
    let message: string;
    if (item.kind === 'medical') {
      if (this.health >= PLAYER_MAX_HEALTH) { this.showNotice('HEALTH IS ALREADY FULL', 1.3); return; }
      const healed = Math.min(40, PLAYER_MAX_HEALTH - this.health);
      this.health += healed;
      message = 'MEDKIT +' + Math.round(healed) + ' HEALTH';
    } else if (item.kind === 'shield') {
      if (this.shield >= 75) { this.showNotice('SHIELD IS ALREADY FULL', 1.3); return; }
      const gained = Math.min(30, 75 - this.shield);
      this.shield += gained;
      message = 'SHIELD +' + Math.round(gained);
    } else {
      this.boostTimer = Math.max(this.boostTimer, 6.5);
      message = 'SPEED BOOST — MOVE!';
    }
    item.active = false;
    item.respawnTimer = 12 + this.random() * 11;
    this.suppliesCollected++;
    this.showNotice(message, 2.1);
  }
  private performAttack(): void {
    this.attackCooldown = 0.39;
    this.attackTimer = 0.19;
    let hitCount = 0;
    for (const zombie of this.zombies) {
      if (!zombie.active) continue;
      const dx = zombie.x - this.player.x, dy = zombie.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > MELEE_RANGE) continue;
      hitCount++;
      zombie.health -= 36;
      zombie.hitFlash = 0.16;
      const direction = distance > 0.001 ? vec2(dx / distance, dy / distance) : vec2(zombie.id % 2 ? 1 : -1, 0);
      const bumped = moveCircle(vec2(zombie.x, zombie.y), vec2(direction.x * 48, direction.y * 48), 13, this.nearbyObstacles(zombie, 64));
      const bounded = clampToIsland(bumped);
      zombie.x = bounded.x; zombie.y = bounded.y;
      if (zombie.health <= 0) {
        zombie.active = false;
        zombie.respawnTimer = 6 + this.random() * 6;
        this.kills++;
        this.showNotice(this.kills % 5 === 0 ? String(this.kills) + ' ZOMBIES DOWN — KEEP MOVING' : 'ZOMBIE CLEARED', 1.7);
        if (this.random() < 0.36) this.addPickup(zombie.x + (this.random() - 0.5) * 34, zombie.y + (this.random() - 0.5) * 34);
      }
    }
    if (hitCount === 0) this.showNotice('PULSE MISSED — GET CLOSER', 0.85);
  }
  private hurtPlayer(amount: number): void {
    if (this.invulnerabilityTimer > 0 || this.respawnTimer > 0) return;
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    this.health = Math.max(0, this.health - (amount - absorbed));
    this.invulnerabilityTimer = 0.42;
    if (this.health <= 0) {
      this.deaths++;
      this.respawnTimer = 2.35;
      this.showNotice('OVERRUN — YOU’RE GETTING BACK UP', this.respawnTimer);
    } else if (this.health < 35) this.showNotice('LOW HEALTH — FIND A MEDKIT', 1.2);
  }

  update(dt: number, input: SurvivalInput): void {
    if (!(dt >= 0) || !Number.isFinite(dt)) throw new RangeError('dt must be finite and non-negative.');
    const step = Math.min(dt, 0.1);
    this.elapsed += step;
    const wave = 1 + Math.floor(this.elapsed / 75);
    if (wave > this.announcedWave) {
      this.announcedWave = wave;
      this.showNotice('WAVE ' + wave + ' — THE HORDE IS GETTING STRONGER', 3.2);
    }
    this.attackCooldown = Math.max(0, this.attackCooldown - step);
    this.attackTimer = Math.max(0, this.attackTimer - step);
    this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - step);
    this.boostTimer = Math.max(0, this.boostTimer - step);
    this.noticeTimer = Math.max(0, this.noticeTimer - step);

    if (this.respawnTimer > 0) {
      this.respawnTimer = Math.max(0, this.respawnTimer - step);
      if (this.respawnTimer === 0) {
        this.health = PLAYER_MAX_HEALTH;
        this.shield = 20;
        this.invulnerabilityTimer = 2.6;
        this.showNotice('BACK IN IT — KEEP SURVIVING', 2.2);
      }
    } else {
      const direction = normalize(vec2(
        Number(input.isDown('right')) - Number(input.isDown('left')),
        Number(input.isDown('down')) - Number(input.isDown('up')),
      ));
      const speed = PLAYER_SPEED * (this.boostTimer > 0 ? 1.28 : 1);
      const moved = moveCircle(this.player, vec2(direction.x * speed * step, direction.y * speed * step), PLAYER_RADIUS, this.nearbyObstacles(this.player, 100));
      this.player = clampToIsland(moved);
      if (input.isActionDown('attack') && this.attackCooldown <= 0) this.performAttack();
      if (input.consumePressed('interact')) this.collectNearbyPickup();
    }

    for (const item of this.pickups) {
      if (item.active) continue;
      item.respawnTimer = Math.max(0, item.respawnTimer - step);
      if (item.respawnTimer === 0) item.active = true;
    }
    for (const zombie of this.zombies) {
      zombie.hitFlash = Math.max(0, zombie.hitFlash - step);
      zombie.attackCooldown = Math.max(0, zombie.attackCooldown - step);
      if (!zombie.active) {
        zombie.respawnTimer = Math.max(0, zombie.respawnTimer - step);
        if (zombie.respawnTimer === 0) {
          const point = this.spawnPoint(820, 1500);
          zombie.x = point.x; zombie.y = point.y;
          zombie.health = Math.round(ZOMBIE_MAX_HEALTH * (1 + Math.min(0.8, Math.floor(this.elapsed / 75) * 0.06)));
          zombie.active = true;
          zombie.attackCooldown = 0.8;
          zombie.wanderTimer = 0;
          zombie.wanderAngle = this.random() * Math.PI * 2;
        }
        continue;
      }
      const dx = this.player.x - zombie.x, dy = this.player.y - zombie.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 2350) { zombie.active = false; zombie.respawnTimer = 2.6; continue; }
      zombie.wanderTimer -= step;
      let desired: Vector2;
      if (distance < 1750) desired = normalize(vec2(dx, dy));
      else {
        if (zombie.wanderTimer <= 0) {
          zombie.wanderAngle += (this.random() - 0.5) * 2.2;
          zombie.wanderTimer = 1.4 + this.random() * 2.8;
        }
        desired = vec2(Math.cos(zombie.wanderAngle), Math.sin(zombie.wanderAngle));
      }
      const difficulty = 1 + Math.min(0.5, Math.floor(this.elapsed / 75) * 0.04);
      const zombieSpeed = (distance < 1750 ? 83 : 28) * difficulty;
      const movedZombie = moveCircle(vec2(zombie.x, zombie.y), vec2(desired.x * zombieSpeed * step, desired.y * zombieSpeed * step), 13, this.nearbyObstacles(zombie, 85));
      const bounded = clampToIsland(movedZombie);
      zombie.x = bounded.x; zombie.y = bounded.y;
      if (this.respawnTimer <= 0 && distance < ZOMBIE_ATTACK_RANGE && zombie.attackCooldown <= 0) {
        zombie.attackCooldown = 0.95 + this.random() * 0.18;
        this.hurtPlayer(8);
      }
    }
  }
}
