import test from 'node:test';
import assert from 'node:assert/strict';
import {splitClip,trimClip,snapBar,musicalPosition} from '../dist/editing.js';
import {AudioEngine} from '../dist/audio.js';

test('audio cuts preserve source, gain and duration without modifying the original',()=>{
  const original={id:'a',start:2,length:4,audioId:'source',sourceOffset:1.25,gainDb:9};
  const parts=splitClip(original,3.5,120,'b');
  assert.equal(original.length,4);assert.equal(parts[0].length,1.5);assert.equal(parts[1].length,2.5);
  assert.equal(parts[1].sourceOffset,4.25);assert.equal(parts[1].gainDb,9);assert.equal(parts[1].audioId,'source');
  assert.equal(parts[1].start+parts[1].length,original.start+original.length);
  assert.equal(splitClip(original,2,120,'b'),null);assert.equal(splitClip(original,6,120,'b'),null);
});
test('left audio trims can be reversed and right trims respect available source',()=>{
  const c={id:'a',start:1,length:3,audioId:'s',sourceOffset:0};
  const shorter=trimClip(c,'left',2,16,120,6);assert.equal(shorter.sourceOffset,2);assert.equal(shorter.length,2);
  const restored=trimClip(shorter,'left',1,16,120,6);assert.equal(restored.sourceOffset,0);assert.equal(restored.length,3);
  assert.equal(trimClip(c,'left',0,16,120,6).start,1);
  assert.equal(trimClip(shorter,'right',12,16,120,6).length,2);
});
test('live, export and mid-clip resume all consume the edited audio source offset',()=>{
  const c={id:'a',start:0,length:2,audioId:'s',sourceOffset:2.5,gainDb:4};
  const p={bpm:120,bars:4,swing:0,tracks:[{id:'t',clips:[c]}]},assets=new Map([['s',{buffer:{duration:9}}]]);
  const engine=new AudioEngine(()=>p,()=>assets),calls=[];engine.ctx={};engine.startTime=0;engine.channels=new Map([['t',{input:{}}]]);engine.audioVoice=(...args)=>calls.push(args);
  engine.scheduleStep({},engine.channels,0,0,true);engine.scheduleStep({},engine.channels,0,0,false);engine.schedulePartialAudio(8);
  assert.deepEqual(calls.map(c=>c[4]),[2.5,2.5,3.5]);assert.deepEqual(calls.map(c=>c[5]),[4,4,3]);
});
function drumEvents(clips){
  const p={bpm:120,bars:8,swing:0,tracks:[{id:'t',type:'drums',clips,instrument:{}}]},engine=new AudioEngine(()=>p,()=>new Map()),calls=[];
  engine.channels=new Map([['t',{input:{}}]]);engine.drum=(ctx,input,voice,time)=>calls.push([voice,time]);
  for(let step=0;step<128;step++)engine.scheduleStep({},engine.channels,step,step*.125);
  return calls;
}
test('split drum patterns retain their phase across the cut in the audio scheduler',()=>{
  const original={id:'a',start:1,length:4,pattern:{kick:[1,0,0,0,0,0,1,0,1,0,0,1,0,0,0,0]}};
  const pieces=splitClip(original,2+3/16,120,'b');assert.equal(pieces[1].patternOffset,19);
  assert.deepEqual(drumEvents(pieces),drumEvents([original]));
  const free=splitClip(original,2.13,120,'c'),a=drumEvents(free),b=drumEvents([original]);assert.equal(a.length,b.length);for(let i=0;i<a.length;i++){assert.equal(a[i][0],b[i][0]);assert.ok(Math.abs(a[i][1]-b[i][1])<1e-9);}
  pieces[1].pattern.kick[0]=0;assert.equal(original.pattern.kick[0],1);
});
test('notes moved off the grid keep their onset instead of disappearing',()=>{
  const clip={start:.1,length:1,notes:[{step:0,len:1,midi:60}]},p={bpm:120,bars:4,swing:0,tracks:[{id:'t',type:'keys',clips:[clip],instrument:{}}]},engine=new AudioEngine(()=>p,()=>new Map()),calls=[];
  engine.channels=new Map([['t',{input:{}}]]);engine.synth=(...args)=>calls.push(args);
  for(let step=0;step<16;step++)engine.scheduleStep({},engine.channels,step,step*.125);
  assert.equal(calls.length,1);assert.ok(Math.abs(calls[0][4]-.2)<1e-10);
});
test('musical positions, grid placement and free placement use explicit units',()=>{
  assert.equal(musicalPosition(0),'001 | 1 | 000');assert.equal(musicalPosition(1.25),'002 | 2 | 000');
  assert.equal(snapBar(.3,'grid',.25),.25);assert.equal(snapBar(.3,'slip',.25),.3);
});
