import { FixedStepLoop } from './core/FixedStepLoop';
import { GameSimulation } from './core/GameSimulation';
import { InputManager } from './input/InputManager';
import { GameRenderer } from './render/GameRenderer';
import { WORLD_PROPS } from './world/WorldMap';
import './style.css';

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  const status = document.querySelector<HTMLElement>('#status');
  const coordinates = document.querySelector<HTMLElement>('#coordinates');
  if (!canvas || !status || !coordinates) throw new Error('Required game DOM elements are missing.');

  const renderer = new GameRenderer();
  const input = new InputManager();
  const collisionGeometry = WORLD_PROPS.flatMap((prop) => prop.collision ? [prop.collision] : []);
  const simulation = new GameSimulation(collisionGeometry);
  const loop = new FixedStepLoop();
  await renderer.init(canvas, WORLD_PROPS);
  input.attach();
  status.textContent = 'MILESTONE 2 · WORLD ONLINE';

  let previous = performance.now();
  let lastHudUpdate = 0;
  let animationFrame = 0;
  const frame = (now: number): void => {
    const elapsedSeconds = Math.max(0, (now - previous) / 1000);
    previous = now;
    loop.advance(elapsedSeconds, (dt) => simulation.update(dt, input));
    const position = simulation.playerPosition;
    renderer.render(position);
    if (now - lastHudUpdate > 100) {
      coordinates.textContent = `WORLD ${position.x.toFixed(1)}, ${position.y.toFixed(1)}`;
      lastHudUpdate = now;
    }
    animationFrame = requestAnimationFrame(frame);
  };
  animationFrame = requestAnimationFrame(frame);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(animationFrame);
    input.detach();
    renderer.destroy();
  }, { once: true });
}

main().catch((error: unknown) => {
  console.error(error);
  const panel = document.querySelector<HTMLElement>('#startup-error');
  const message = document.querySelector<HTMLElement>('#startup-error-message');
  if (panel && message) {
    message.textContent = error instanceof Error ? error.message : String(error);
    panel.hidden = false;
  }
  const status = document.querySelector<HTMLElement>('#status');
  if (status) status.textContent = 'STARTUP ERROR';
});
