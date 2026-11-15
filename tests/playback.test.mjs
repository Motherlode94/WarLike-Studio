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
test('concurrent audio initialisation shares one operation and retries after a failure',async()=>{
 const e=new AudioEngine(()=>emptyProject(),()=>new Map());let calls=0,release;e.initialiseContext=()=>{calls++;return new Promise(resolve=>release=resolve);};
 const a=e.init(),b=e.init();assert.equal(calls,1);release('ready');assert.deepEqual(await Promise.all([a,b]),['ready','ready']);
 e.initialiseContext=async()=>{throw Error('audio unavailable');};await assert.rejects(e.init(),/audio unavailable/);
 e.initialiseContext=async()=> 'recovered';assert.equal(await e.init(),'recovered');
});
test('stop during pending initialisation cancels playback before loading instruments',async()=>{
 const e=new AudioEngine(()=>emptyProject(),()=>new Map());let release,prepared=0;e.init=()=>new Promise(resolve=>release=resolve);e.prepareInstruments=async()=>prepared++;
 const pending=e.play();e.stop();release();await pending;assert.equal(prepared,0);assert.equal(e.playing,false);assert.equal(e.position,0);
});


test('short scheduler stalls keep sustaining voices and skip overdue drum attacks',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:.37};e.playing=true;e.startTime=0;e.scheduledStep=0;e.loop=true;
 let stopped=0;const tail={stop(){stopped++;}};e.voices.add(tail);
 const scheduled=[],underruns=[];e.scheduleStep=(...args)=>scheduled.push(args);e.scheduleAutomation=()=>{};e.onAudioUnderrun=x=>underruns.push(x);
 e.scheduler();
 assert.equal(stopped,0,'a 370ms main-thread stall must not cut a sustained audio clip');
 assert.equal(e.voices.has(tail),true);
 assert.equal(underruns.length,1);assert.equal(underruns[0].hardRecovery,false);
 assert.equal(e.audioUnderruns,1);
 assert.ok(scheduled.length>=1);
 assert.ok(scheduled.every(args=>args[3]>=e.ctx.currentTime+.004-1e-9),'never fire a late event in the past');
 assert.ok(scheduled.every(args=>args[5]>=e.ctx.currentTime+.004-1e-9),'pass minimumTime to the per-note scheduler');
});

test('small late events are skipped rather than played as an immediate burst',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:.124};e.playing=true;e.startTime=0;e.scheduledStep=0;e.loop=true;
 const scheduled=[];e.scheduleStep=(...args)=>scheduled.push(args);e.scheduleAutomation=()=>{};
 e.scheduler();
 assert.equal(scheduled.length,1);
 assert.equal(scheduled[0][2],1,'step zero is too late and must be skipped');
 assert.ok(scheduled[0][3]>.124);
});

test('large background wake-up bounds backlog and reports hard recovery',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:100};e.playing=true;e.startTime=0;e.scheduledStep=0;e.loop=true;
 const events=[];let resumed=0;e.onAudioUnderrun=e=>events.push(e);e.scheduleStep=()=>{};e.schedulePartialAudio=()=>resumed++;e.scheduleAutomation=()=>{};
 e.scheduler();assert.equal(events.length,1);assert.equal(events[0].hardRecovery,true);assert.equal(resumed,1);
 assert.equal(e.audioUnderruns,1);
});
