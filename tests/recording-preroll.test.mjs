import test from 'node:test';
import assert from 'node:assert/strict';
import {recordingRange,recordingWindow} from '../dist/recording-range.js';
import {recordingSettings} from '../dist/recording.js';
import {createRecordingPreRoll} from '../dist/recording-preroll.js';
function clock(){let tick,clears=0;const ctx={currentTime:10,state:'running'};return {ctx,setTimer(fn){tick=fn;return 42;},clearTimer(id){assert.equal(id,42);clears++;},tick(){tick();},get clears(){return clears;}};}
test('pre-roll is optional in old projects and shares the bounded capture tempo',()=>{
 const range={enabled:true,start:4,end:8};assert.deepEqual(recordingSettings({range}).range,range);
 assert.deepEqual(recordingRange({...range,preRollBars:0}),range);
 for(const bpm of [40,78,120,240])for(const preRollBars of [0,1,2,4]){
  const plan=recordingWindow({...range,preRollBars},{bars:16,bpm});assert.equal(plan.playbackStart,4-preRollBars);assert.equal(plan.preRollSeconds,preRollBars*240/bpm);assert.equal(plan.seconds,4*240/bpm);
 }
 const saved=recordingSettings({range:{...range,preRollBars:2}});assert.deepEqual(saved.range,{...range,preRollBars:2});
 for(const preRollBars of [-1,3,.5,NaN,Infinity,'bad'])assert.throws(()=>recordingRange({...range,preRollBars}),/Prélecture invalide/);
});
test('pre-roll shortens at the song origin without moving or extending the take',()=>{
 const p={bars:16,bpm:120},start=recordingWindow({enabled:true,start:0,end:1,preRollBars:4},p);assert.equal(start.playbackStart,0);assert.equal(start.preRollSeconds,0);assert.equal(start.seconds,2);
 const partial=recordingWindow({enabled:true,start:1.5,end:2,preRollBars:4},p);assert.equal(partial.playbackStart,0);assert.equal(partial.preRollSeconds,3);assert.equal(partial.seconds,1);
 assert.equal(recordingWindow({enabled:false,start:4,end:8,preRollBars:2},p),null);
});
test('the observer follows the audio clock through count-in, pre-roll and a late UI tick',async()=>{
 const c=clock(),changes=[],r=createRecordingPreRoll(c.ctx,{startAt:12,endAt:16,bpm:120,onChange:s=>changes.push(s),setTimer:c.setTimer,clearTimer:c.clearTimer});
 assert.equal(r.state.status,'waiting');assert.equal(r.state.remainingBeats,8);c.ctx.currentTime=12.6;c.tick();assert.equal(r.state.status,'playing');assert.equal(r.state.remainingBeats,7);
 c.ctx.currentTime=17;assert.equal(r.state.status,'finished','UI state does not wait for a timer');c.tick();assert.equal(await r.done,true);assert.equal(c.clears,1);assert.ok(changes.some(s=>s.status==='playing'));assert.equal(changes.at(-1).status,'finished');r.cancel();assert.equal(c.clears,1);
});
test('cancellation or suspended audio releases the observer and settles once',async()=>{
 for(const suspend of [false,true]){const c=clock(),r=createRecordingPreRoll(c.ctx,{startAt:10,endAt:14,bpm:120,setTimer:c.setTimer,clearTimer:c.clearTimer});if(suspend){c.ctx.state='suspended';c.tick();}else r.cancel();assert.equal(await r.done,false);assert.equal(r.state.status,'cancelled');r.cancel();assert.equal(c.clears,1);}
 for(const options of [{startAt:2,endAt:1,bpm:120},{startAt:0,endAt:1,bpm:0},{startAt:NaN,endAt:4,bpm:120}])assert.throws(()=>createRecordingPreRoll(clock().ctx,options),/invalide/);
});
