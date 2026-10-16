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
  const startScreen = document.querySelector<HTMLElement>('#start-screen');
  const playButton = document.querySelector<HTMLButtonElement>('#play-button');
  const howToButton = document.querySelector<HTMLButtonElement>('#how-to-button');
  const howToPanel = document.querySelector<HTMLElement>('#how-to-panel');
  if (!canvas || !status || !coordinates || !startScreen || !playButton || !howToButton || !howToPanel) {
    throw new Error('Required game DOM elements are missing.');
  }

  const renderer = new GameRenderer();
  const input = new InputManager();
  const collisionGeometry = WORLD_PROPS.flatMap((prop) => prop.collision ? [prop.collision] : []);
  const simulation = new GameSimulation(collisionGeometry);
  const loop = new FixedStepLoop();
  await renderer.init(canvas, WORLD_PROPS);
  status.textContent = 'FIELD TEST · READY';

  let started = false;
  const startGame = (): void => {
    if (started) return;
    started = true;
    startScreen.hidden = true;
    input.attach();
    status.textContent = 'FIELD TEST · ACTIVE';
    canvas.focus();
  };

  const toggleHowTo = (): void => {
    const expanded = howToButton.getAttribute('aria-expanded') === 'true';
    howToButton.setAttribute('aria-expanded', String(!expanded));
    howToPanel.hidden = expanded;
    howToButton.textContent = expanded ? 'HOW TO PLAY' : 'HIDE CONTROLS';
  };

  playButton.addEventListener('click', startGame);
  howToButton.addEventListener('click', toggleHowTo);

  let previous = performance.now();
  let lastHudUpdate = 0;
  let animationFrame = 0;
  const frame = (now: number): void => {
    const elapsedSeconds = Math.max(0, (now - previous) / 1000);
    previous = now;
    if (started) loop.advance(elapsedSeconds, (dt) => simulation.update(dt, input));
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
