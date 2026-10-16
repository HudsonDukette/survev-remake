import { FixedStepLoop } from './core/FixedStepLoop';
import { GameSimulation } from './core/GameSimulation';
import { InputManager } from './input/InputManager';
import { GameRenderer } from './render/GameRenderer';
import { SHORE_RADIUS, WORLD_PROPS, WORLD_RADIUS } from './world/WorldMap';
import './style.css';

async function main(): Promise<void> {
  const canvas=document.querySelector<HTMLCanvasElement>('#game-canvas'), status=document.querySelector<HTMLElement>('#status'), map=document.querySelector<HTMLCanvasElement>('#minimap'), start=document.querySelector<HTMLElement>('#start-screen'), play=document.querySelector<HTMLButtonElement>('#play-button'), howTo=document.querySelector<HTMLButtonElement>('#how-to-button'), panel=document.querySelector<HTMLElement>('#how-to-panel'), ctx=map?.getContext('2d');
  if(!canvas||!status||!map||!ctx||!start||!play||!howTo||!panel)throw new Error('Required game DOM elements are missing.');
  const renderer=new GameRenderer(),input=new InputManager(),simulation=new GameSimulation(WORLD_PROPS.flatMap(p=>[...p.collisions]),WORLD_RADIUS),loop=new FixedStepLoop();
  await renderer.init(canvas,WORLD_PROPS);status.textContent='SOLO ISLAND · READY';
  const drawMap=(p:{readonly x:number;readonly y:number}):void=>{
    const size=map.width,center=size/2,scale=(size-16)/(SHORE_RADIUS*2);ctx.clearRect(0,0,size,size);ctx.fillStyle='#428eaa';ctx.fillRect(0,0,size,size);ctx.save();ctx.translate(center,center);ctx.scale(scale,scale);
    ctx.beginPath();ctx.arc(0,0,SHORE_RADIUS,0,Math.PI*2);ctx.fillStyle='#d6c48d';ctx.fill();ctx.beginPath();ctx.arc(0,0,WORLD_RADIUS,0,Math.PI*2);ctx.fillStyle='#80af49';ctx.fill();
    ctx.strokeStyle='#b49b68';ctx.lineWidth=104;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-1540,-430);ctx.bezierCurveTo(-1130,-300,-990,60,-590,20);ctx.bezierCurveTo(-240,-10,-160,-170,170,-75);ctx.bezierCurveTo(520,20,620,265,1000,225);ctx.bezierCurveTo(1210,205,1390,135,1550,100);ctx.stroke();ctx.strokeStyle='#4e99c0';ctx.lineWidth=82;ctx.stroke();
    for(const item of WORLD_PROPS){ctx.fillStyle=item.kind==='building'?'#6b4930':item.kind==='tree'?'#315d32':item.kind==='rock'?'#aaa99c':item.kind==='bush'?'#427737':item.kind==='barrel'?'#776b44':'#9a7144';if(item.kind==='building'){ctx.fillRect(item.x,item.y,item.width,item.height);ctx.strokeStyle='#423124';ctx.lineWidth=8;ctx.strokeRect(item.x,item.y,item.width,item.height);}else{ctx.beginPath();ctx.arc(item.x+item.width/2,item.y+item.height/2,item.kind==='tree'?24:item.kind==='bush'?13:9,0,Math.PI*2);ctx.fill();}}
    ctx.restore();ctx.beginPath();ctx.arc(center+p.x*scale,center+p.y*scale,5.5,0,Math.PI*2);ctx.fillStyle='#f5d9a3';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#3d3326';ctx.stroke();
  };
  let started=false;play.addEventListener('click',()=>{if(started)return;started=true;start.hidden=true;input.attach();status.textContent='SOLO ISLAND · EXPLORING';canvas.focus();});
  howTo.addEventListener('click',()=>{const expanded=howTo.getAttribute('aria-expanded')==='true';howTo.setAttribute('aria-expanded',String(!expanded));panel.hidden=expanded;howTo.textContent=expanded?'HOW TO PLAY':'HIDE CONTROLS';});
  let previous=performance.now(),lastMap=0,frameId=0;const frame=(now:number):void=>{const dt=Math.max(0,(now-previous)/1000);previous=now;if(started)loop.advance(dt,step=>simulation.update(step,input));const position=simulation.playerPosition;renderer.render(position);if(now-lastMap>120){drawMap(position);lastMap=now;}frameId=requestAnimationFrame(frame);};frameId=requestAnimationFrame(frame);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);input.detach();renderer.destroy();},{once:true});
}
main().catch((error:unknown)=>{console.error(error);const panel=document.querySelector<HTMLElement>('#startup-error'),message=document.querySelector<HTMLElement>('#startup-error-message');if(panel&&message){message.textContent=error instanceof Error?error.message:String(error);panel.hidden=false;}const status=document.querySelector<HTMLElement>('#status');if(status)status.textContent='STARTUP ERROR';});
