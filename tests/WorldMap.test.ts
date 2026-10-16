import { describe, expect, it } from 'vitest';
import { circleIntersectsAabb } from '../src/core/Collision2D';
import { PLAYER_RADIUS, GameSimulation } from '../src/core/GameSimulation';
import type { MovementKey } from '../src/input/InputManager';
import { createWorldProps, WORLD_RADIUS } from '../src/world/WorldMap';
function input(...keys: MovementKey[]){return {isDown:(key:MovementKey)=>keys.includes(key)};}
describe('WorldMap',()=>{
 it('generates the same prop placement every time',()=>{expect(createWorldProps()).toEqual(createWorldProps());});
 it('includes environment props and enterable buildings',()=>{const props=createWorldProps();expect(props.length).toBeGreaterThan(120);for(const kind of ['tree','rock','bush','barrel','crate','building'] as const)expect(props.some(p=>p.kind===kind)).toBe(true);expect(props.filter(p=>p.kind==='building')).toHaveLength(5);expect(props.some(p=>p.kind==='bush'&&p.collision===null)).toBe(true);});
 it('keeps a clear spawn and gives trees smaller trunk hitboxes',()=>{const props=createWorldProps();expect(props.every(p=>p.width>0&&p.height>0)).toBe(true);expect(props.every(p=>Math.hypot(p.x+p.width/2,p.y+p.height/2)>=175)).toBe(true);const tree=props.find(p=>p.kind==='tree');expect(tree?.collision).not.toBeNull();expect(tree!.collision!.width).toBeLessThan(tree!.width);expect(tree!.collision!.height).toBeLessThan(tree!.height);});
 it('keeps a walkable opening in every building doorway',()=>{for(const p of createWorldProps().filter(p=>p.kind==='building')){expect(p.collisions).toHaveLength(5);const doorway={x:p.x+p.width/2,y:p.y+p.height-6};expect(p.collisions.some(w=>circleIntersectsAabb(doorway,PLAYER_RADIUS,w))).toBe(false);}});
 it('gives solid props collisions while bushes remain passable',()=>{const props=createWorldProps();for(const kind of ['rock','barrel','crate'] as const)expect(props.find(p=>p.kind===kind)?.collision).not.toBeNull();expect(props.find(p=>p.kind==='bush')?.collisions).toHaveLength(0);});
 it('keeps the player inside the shore boundary',()=>{const game=new GameSimulation([],WORLD_RADIUS);game.update(20,input('right'));expect(Math.hypot(game.playerPosition.x,game.playerPosition.y)).toBeCloseTo(WORLD_RADIUS-PLAYER_RADIUS);});
});
