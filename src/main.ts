import { FixedStepLoop } from './core/FixedStepLoop';
import { InputManager } from './input/InputManager';
import { GameRenderer } from './render/GameRenderer';
import { SurvivalSimulation, type LootKind } from './core/SurvivalSimulation';
import { SHORE_RADIUS, WORLD_PROPS, WORLD_RADIUS } from './world/WorldMap';
import './style.css';

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  const status = document.querySelector<HTMLElement>('#status');
  const map = document.querySelector<HTMLCanvasElement>('#minimap');
  const start = document.querySelector<HTMLElement>('#start-screen');
  const play = document.querySelector<HTMLButtonElement>('#play-button');
  const howTo = document.querySelector<HTMLButtonElement>('#how-to-button');
  const howToPanel = document.querySelector<HTMLElement>('#how-to-panel');
  const healthFill = document.querySelector<HTMLElement>('#health-fill');
  const shieldFill = document.querySelector<HTMLElement>('#shield-fill');
  const healthValue = document.querySelector<HTMLElement>('#health-value');
  const shieldValue = document.querySelector<HTMLElement>('#shield-value');
  const killsValue = document.querySelector<HTMLElement>('#kills-value');
  const deathsValue = document.querySelector<HTMLElement>('#deaths-value');
  const suppliesValue = document.querySelector<HTMLElement>('#supplies-value');
  const timeValue = document.querySelector<HTMLElement>('#time-value');
  const actionHint = document.querySelector<HTMLElement>('#action-hint');
  const toast = document.querySelector<HTMLElement>('#toast');
  const deathOverlay = document.querySelector<HTMLElement>('#death-overlay');
  const deathCountdown = document.querySelector<HTMLElement>('#death-countdown');
  const ctx = map?.getContext('2d');

  if (!canvas || !status || !map || !ctx || !start || !play || !howTo || !howToPanel ||
      !healthFill || !shieldFill || !healthValue || !shieldValue || !killsValue ||
      !deathsValue || !suppliesValue || !timeValue || !actionHint || !toast ||
      !deathOverlay || !deathCountdown) throw new Error('Required game DOM elements are missing.');

  const renderer = new GameRenderer();
  const input = new InputManager();
  const simulation = new SurvivalSimulation(WORLD_PROPS.flatMap(prop => [...prop.collisions]), WORLD_PROPS);
  const loop = new FixedStepLoop();
  await renderer.init(canvas, WORLD_PROPS);
  status.textContent = 'ISLAND SECURED · READY';

  const lootLabel = (kind: LootKind): string => kind === 'medical' ? 'MEDKIT' : kind === 'shield' ? 'SHIELD' : 'SPEED BOOST';
  const formatTime = (seconds: number): string => {
    const total = Math.floor(seconds);
    return Math.floor(total / 60).toString().padStart(2, '0') + ':' + (total % 60).toString().padStart(2, '0');
  };

  const drawMap = (): void => {
    const state = simulation.snapshot;
    const size = map.width, center = size / 2, scale = (size - 14) / (SHORE_RADIUS * 2);
    const worldScale = WORLD_RADIUS / 1550;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#428eaa';
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.scale(scale, scale);

    ctx.beginPath(); ctx.arc(0, 0, SHORE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#d6c48d'; ctx.fill();
    ctx.strokeStyle = '#76583a'; ctx.lineWidth = 18; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, WORLD_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#80af49'; ctx.fill();
    ctx.strokeStyle = '#4b7735'; ctx.lineWidth = 20; ctx.stroke();

    ctx.strokeStyle = '#b49b68'; ctx.lineWidth = 138; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-1540 * worldScale, -430 * worldScale);
    ctx.bezierCurveTo(-1130 * worldScale,-300 * worldScale,-990 * worldScale,60 * worldScale,-590 * worldScale,20 * worldScale);
    ctx.bezierCurveTo(-240 * worldScale,-10 * worldScale,-160 * worldScale,-170 * worldScale,170 * worldScale,-75 * worldScale);
    ctx.bezierCurveTo(520 * worldScale,20 * worldScale,620 * worldScale,265 * worldScale,1000 * worldScale,225 * worldScale);
    ctx.bezierCurveTo(1210 * worldScale,205 * worldScale,1390 * worldScale,135 * worldScale,1550 * worldScale,100 * worldScale);
    ctx.stroke();
    ctx.strokeStyle = '#4e99c0'; ctx.lineWidth = 104; ctx.stroke();

    for (const item of WORLD_PROPS) {
      ctx.fillStyle = item.kind === 'building' ? '#62452d'
        : item.kind === 'tree' ? '#315d32'
        : item.kind === 'rock' ? '#aaa99c'
        : item.kind === 'bush' ? '#427737'
        : item.kind === 'barrel' ? '#776b44' : '#9a7144';
      if (item.kind === 'building') ctx.fillRect(item.x, item.y, item.width, item.height);
      else {
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2,
          item.kind === 'tree' ? 34 : item.kind === 'bush' ? 15 : 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const item of state.pickups) {
      if (!item.active) continue;
      ctx.fillStyle = item.kind === 'medical' ? '#f6eee0' : item.kind === 'shield' ? '#79c4e8' : '#f5d06a';
      ctx.beginPath(); ctx.arc(item.x, item.y, 26, 0, Math.PI * 2); ctx.fill();
    }
    for (const zombie of state.zombies) {
      if (!zombie.active) continue;
      ctx.fillStyle = '#d85f4d'; ctx.beginPath(); ctx.arc(zombie.x, zombie.y, 54, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f5d9a3';
    ctx.beginPath(); ctx.arc(state.playerPosition.x, state.playerPosition.y, 88, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 30; ctx.strokeStyle = '#3d3326'; ctx.stroke();
    ctx.restore();
  };

  const renderHud = (): void => {
    const state = simulation.snapshot;
    healthFill.style.width = String(Math.max(0, state.health)) + '%';
    shieldFill.style.width = String(Math.max(0, state.shield) / 75 * 100) + '%';
    healthValue.textContent = String(Math.ceil(state.health));
    shieldValue.textContent = String(Math.ceil(state.shield));
    killsValue.textContent = String(state.kills);
    deathsValue.textContent = String(state.deaths);
    suppliesValue.textContent = String(state.suppliesCollected);
    timeValue.textContent = formatTime(state.survivalSeconds);
    status.textContent = state.respawnTimer > 0 ? 'RECOVERING' : 'WAVE ' + state.wave + ' · SURVIVING';

    const nearby = simulation.nearbyPickup;
    actionHint.textContent = nearby ? 'E  ·  PICK UP ' + lootLabel(nearby.kind) : 'SPACE  ·  PULSE ATTACK';
    actionHint.classList.toggle('has-loot', Boolean(nearby));
    if (state.noticeTimer > 0 && state.notice) {
      toast.textContent = state.notice;
      toast.hidden = false;
      toast.classList.toggle('warning', state.health < 35 || state.respawnTimer > 0);
    } else toast.hidden = true;
    deathOverlay.hidden = state.respawnTimer <= 0;
    deathCountdown.textContent = Math.max(0, state.respawnTimer).toFixed(1) + 's';
  };

  let started = false;
  play.addEventListener('click', () => {
    if (started) return;
    started = true; start.hidden = true; input.attach(); status.textContent = 'WAVE 1 · SURVIVING'; canvas.focus();
  });
  howTo.addEventListener('click', () => {
    const expanded = howTo.getAttribute('aria-expanded') === 'true';
    howTo.setAttribute('aria-expanded', String(!expanded));
    howToPanel.hidden = expanded;
    howTo.textContent = expanded ? 'HOW TO PLAY' : 'HIDE CONTROLS';
  });

  let previous = performance.now(), lastMap = 0, lastHud = 0, frameId = 0;
  const frame = (now: number): void => {
    const dt = Math.max(0, Math.min(0.1, (now - previous) / 1000));
    previous = now;
    if (started) loop.advance(dt, step => simulation.update(step, input));
    renderer.render(simulation.snapshot);
    if (now - lastMap > 180) { drawMap(); lastMap = now; }
    if (now - lastHud > 100) { renderHud(); lastHud = now; }
    frameId = requestAnimationFrame(frame);
  };
  frameId = requestAnimationFrame(frame);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frameId); input.detach(); renderer.destroy();
  }, { once: true });
}
main().catch((error: unknown) => {
  console.error(error);
  const panel = document.querySelector<HTMLElement>('#startup-error');
  const message = document.querySelector<HTMLElement>('#startup-error-message');
  if (panel && message) { message.textContent = error instanceof Error ? error.message : String(error); panel.hidden = false; }
  const status = document.querySelector<HTMLElement>('#status');
  if (status) status.textContent = 'STARTUP ERROR';
});
