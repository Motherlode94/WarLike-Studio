import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine,emptyProject} from '../dist/audio.js';
test('waking from a background tab skips overdue events instead of scheduling a backlog',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:3600};e.playing=true;e.startTime=0;e.scheduledStep=0;e.loop=true;
 let scheduled=0,resumed=0;e.scheduleStep=()=>{if(++scheduled>4)throw Error('unbounded backlog');};e.schedulePartialAudio=()=>resumed++;e.scheduleAutomation=()=>{};
 e.scheduler();assert.ok(scheduled<=2);assert.equal(resumed,1);assert.equal(e.voices.size,0);
});
test('changing sessions clears PAT and clip auditions and disposes every previous channel',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.patternMode='old';e.clipPreview={trackId:'old'};let disposed=0;e.channels.set('old',{});e.graph={};e.disposeChannel=()=>disposed++;e.resetSession();
 assert.equal(e.playing,false);assert.equal(e.patternMode,null);assert.equal(e.clipPreview,null);assert.equal(e.position,0);assert.equal(e.channels.size,0);assert.equal(disposed,1);
});
test('voice cleanup waits for all sources and releases the velocity and envelope nodes',()=>{
 const e=new AudioEngine(()=>emptyProject(),()=>new Map());let disconnected=0;const scope=e.voiceScope({createGain:()=>({disconnect(){disconnected++;}})});scope.node('createGain');scope.node('createGain');
 const listeners=[];for(let i=0;i<2;i++)scope.watch({addEventListener:(event,cb)=>listeners.push(cb)});
 listeners[0]();assert.equal(disconnected,0);listeners[1]();assert.equal(disconnected,2);
});
