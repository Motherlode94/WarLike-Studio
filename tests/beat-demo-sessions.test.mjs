import test from 'node:test';
import assert from 'node:assert/strict';
import {createBeatDemoSession,BEAT_DEMOS} from '../dist/beat-demo-sessions.js';
import {AudioEngine} from '../dist/audio.js';
import {INSTRUMENTS} from '../dist/plugins.js';

test('new scores use real instruments, valid editable events and independent local state',()=>{
 for(const style of Object.keys(BEAT_DEMOS)){
  const a=createBeatDemoSession(style),b=createBeatDemoSession(style);
  assert.equal(a.bars,16);assert.equal(a.tracks.length,9);
  assert.equal(a.tracks.filter(t=>t.type==='audio'&&t.clips.length===0).length,3);
  for(const t of a.tracks.filter(t=>t.type!=='audio')){
   const controls=INSTRUMENTS[t.type].controls;
   for(const [key,value] of Object.entries(t.instrument)){
    const c=controls.find(c=>c.key===key);assert.ok(c,key);
    assert.ok(Number.isFinite(value)&&value>=c.min&&value<=c.max,style+':'+key);
   }
   assert.ok(t.clips.length>=3);
   for(const c of t.clips){
    assert.ok(c.start>=0&&c.start+c.length<=16);
    for(const n of c.notes||[])assert.ok(n.step>=0&&n.len>0&&n.step+n.len<=64&&n.midi>=0&&n.midi<=127&&n.velocity>0&&n.velocity<=1);
    for(const row of Object.values(c.pattern||{}))assert.ok(row.length===64&&row.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
   }
  }
  a.tracks[0].clips[0].pattern.kick.fill(0);a.tracks[1].instrument.body=0;a.mastering.peak.ceiling=-6;
  assert.ok(b.tracks[0].clips[0].pattern.kick.some(Boolean));assert.equal(b.mastering.peak.ceiling,-1.5);
  assert.notEqual(a.tracks[0].id,b.tracks[0].id);
 }
 for(const invalid of ['unknown','toString','__proto__'])assert.throws(()=>createBeatDemoSession(invalid));
});

test('808 scores leave space for release instead of stacking sub notes',()=>{
 for(const style of ['drill','trap808']){
  const p=createBeatDemoSession(style),bass=p.tracks.find(t=>t.type==='bass'),releaseSteps=bass.instrument.release*p.bpm/15;
  assert.equal(bass.pan,0);
  assert.ok(bass.instrument.harmonics>.2,'harmonics make the sub readable on smaller speakers');
  for(const c of bass.clips)for(const [i,n] of c.notes.entries()){
   assert.ok(n.midi>=24&&n.midi<=48,'audible sub register');
   assert.ok(n.step+n.len+releaseSteps<=(c.notes[i+1]?.step??64));
  }
 }
});

test('drill and trap 1/32 hats actually schedule between sixteenth events, including after JSON round-trip',()=>{
 for(const style of ['drill','trap808']){
  const p=JSON.parse(JSON.stringify(createBeatDemoSession(style))),hits=[];
  const engine=new AudioEngine(()=>p,()=>new Map());
  engine.drum=(_ctx,out,voice,time)=>{if(voice==='hat')hits.push({out,time});};engine.synth=()=>{};
  const channels=new Map(p.tracks.map(t=>[t.id,{input:t.name}])),sd=15/p.bpm;
  for(let step=64;step<128;step++)engine.scheduleStep({},channels,step,(step-64)*sd);
  const fills=hits.filter(h=>h.out.startsWith('HI-HAT'));
  assert.ok(fills.length>=8,'roll track must be audible');
  assert.ok(fills.every(h=>Math.abs(h.time/sd%1-.5)<.02),'rolls lost their half-step timing');
  const all=hits.map(h=>h.time).sort((a,b)=>a-b);
  assert.ok(all.some((v,i)=>i&&Math.abs((v-all[i-1])/sd-.5)<.02));
 }
});

test('three demos have distinct grooves, harmony, timbres and section development',()=>{
 const scores=Object.keys(BEAT_DEMOS).map(createBeatDemoSession);
 assert.equal(new Set(scores.map(p=>p.bpm)).size,3);
 assert.equal(new Set(scores.map(p=>JSON.stringify(p.tracks[0].clips[1].pattern))).size,3);
 assert.equal(new Set(scores.map(p=>JSON.stringify(p.tracks[1].clips[1].notes.map(({step,midi,len})=>({step,midi,len}))))).size,3);
 for(const p of scores){
  assert.notDeepEqual(p.tracks[0].clips[0].pattern,p.tracks[0].clips[3].pattern);
  assert.ok(p.tracks.some(t=>t.clips.some(c=>c.notes?.some(n=>n.step%1!==0)))||p.tracks.some(t=>t.name.startsWith('HI-HAT')));
 }
});
