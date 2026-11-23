import test from 'node:test';
import assert from 'node:assert/strict';
import {countInBars,countInPlan,createRecordingCountIn} from '../dist/recording-count-in.js';
import {recordingSettings} from '../dist/recording.js';
import {AudioEngine,emptyProject} from '../dist/audio.js';
function clock(){
 const voices=[],gains=[];let tick,cleared=0;
 const ctx={currentTime:10,state:'running',destination:{name:'output'},createOscillator(){const o={frequency:{},started:[],stopped:[],connect(n){this.target=n;},disconnect(){this.disconnected=true;},addEventListener(){},start(t){this.started.push(t);},stop(t){this.stopped.push(t);}};voices.push(o);return o;},createGain(){const g={gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(n){this.target=n;},disconnect(){this.disconnected=true;}};gains.push(g);return g;}};
 return {ctx,voices,gains,setTimer(fn){tick=fn;return 7;},clearTimer(id){assert.equal(id,7);cleared++;},tick(){tick();},get cleared(){return cleared;}};
}
test('count-in settings preserve old projects and accept only zero, one or two bars',()=>{
 for(const value of [undefined,null,0,-1,3,1.5,NaN,'invalid'])assert.equal(countInBars(value),0);
 assert.equal(countInBars('1'),1);assert.equal(recordingSettings({countInBars:2}).countInBars,2);assert.equal(recordingSettings().countInBars,0);
});
test('four-beat bars are scheduled at the project tempo on the audio clock',()=>{
 for(const bpm of [40,78,120,240])for(const bars of [1,2]){
  const p=countInPlan({bpm,bars,startAt:7.25});assert.equal(p.clicks.length,bars*4);assert.ok(Math.abs(p.endAt-(7.25+bars*240/bpm))<1e-9);
  for(const [i,c] of p.clicks.entries()){assert.ok(Math.abs(c.time-(7.25+i*60/bpm))<1e-9);assert.equal(c.accent,i%4===0);}
 }
 assert.equal(countInPlan({bpm:120,bars:0,startAt:7}).endAt,7);assert.throws(()=>countInPlan({bpm:0,bars:1}),/invalide/);
});
test('a delayed UI timer does not delay or reschedule the native clicks',async()=>{
 const c=clock(),changes=[],r=createRecordingCountIn(c.ctx,{bars:2,bpm:120,onChange:s=>changes.push(s),setTimer:c.setTimer,clearTimer:c.clearTimer});
 assert.equal(c.voices.length,8);assert.ok(c.gains.every(g=>g.target===c.ctx.destination));assert.equal(r.state.bar,1);assert.equal(r.state.beat,1);
 c.ctx.currentTime=12.61;c.tick();assert.equal(r.state.bar,2);assert.equal(r.state.beat,2);
 c.ctx.currentTime=r.endAt+.4;c.tick();assert.equal(await r.done,true);assert.equal(r.state.status,'finished');assert.equal(c.cleared,1);
 assert.deepEqual(c.voices.map(v=>v.started[0]),countInPlan({bars:2,bpm:120,startAt:10.1}).clicks.map(c=>c.time));assert.ok(changes.some(s=>s.status==='finished'));
});
test('cancelling releases every scheduled voice and settles only once',async()=>{
 const c=clock(),r=createRecordingCountIn(c.ctx,{bars:1,bpm:99,setTimer:c.setTimer,clearTimer:c.clearTimer});r.cancel();r.cancel();
 assert.equal(await r.done,false);assert.equal(r.state.status,'cancelled');assert.equal(c.cleared,1);assert.ok(c.voices.every(v=>v.disconnected&&v.stopped.length===2));assert.ok(c.gains.every(g=>g.disconnected));
});
test('suspending the audio context cancels the pending take instead of hanging',async()=>{
 const c=clock(),r=createRecordingCountIn(c.ctx,{bars:1,bpm:120,setTimer:c.setTimer,clearTimer:c.clearTimer});c.ctx.state='suspended';c.tick();assert.equal(await r.done,false);assert.equal(r.state.status,'cancelled');
});
test('future transport starts hold the selected cursor and preserve loop playback',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:10};e.position=64;e.playing=true;e.playStartAt=12;e.startTime=12-64*e.stepDuration;e.loop=false;
 assert.equal(e.getPosition(),64);e.ctx.currentTime=12.5;assert.equal(e.getPosition(),68);
 e.loop=true;e.position=128;e.playStartAt=0;e.startTime=0;e.ctx.currentTime=40;assert.ok(e.getPosition()<p.bars*16,'loop wraps after the scheduled start');
});
test('scheduled playback aligns clips and automation, and refuses a missed start',async()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:10};e.position=64;e.loop=false;
 e.init=async()=>{};e.prepareInstruments=async()=>{};e.scheduler=()=>{};let audioAt,automationAt;
 e.schedulePartialAudio=position=>{audioAt=e.startTime+position*e.stepDuration;};e.scheduleAutomation=(ctx,graph,start,end,when)=>{automationAt=when;};
 try{await e.play({startAt:12});assert.equal(audioAt,12);assert.equal(automationAt,12);assert.equal(e.getPosition(),64);e.ctx.currentTime=12.125;assert.equal(e.getPosition(),65);}finally{e.pause();}
 await assert.rejects(e.play({startAt:11}),/dépassé/);assert.equal(e.playing,false);
});
test('cancelling a count-in near the song end does not extend the project',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:10};e.position=255;e.scheduledStep=255;e.playing=true;e.loop=false;e.playStartAt=12;e.startTime=12-255*e.stepDuration;e.recordingTrackId=p.tracks[0].id;e.scheduleStep=()=>{};
 e.scheduler();assert.equal(p.bars,16);e.ctx.currentTime=11.99;e.scheduler();assert.equal(p.bars,16);assert.equal(e.playing,true);
 e.ctx.currentTime=12;e.scheduler();assert.ok(p.bars>16,'normal extension begins only when recording starts');
});
