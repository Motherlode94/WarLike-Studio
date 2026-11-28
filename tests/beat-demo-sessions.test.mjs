import test from 'node:test';
import assert from 'node:assert/strict';
import {createBeatDemoSession,BEAT_DEMOS} from '../dist/beat-demo-sessions.js';
import {AudioEngine} from '../dist/audio.js';
import {INSTRUMENTS,EFFECTS} from '../dist/plugins.js';
import {readFileSync} from 'node:fs';
import {isRecordedDrumKit} from '../dist/baile-drum-voices.js';
import {normalizeNotes,moveNotes} from '../dist/piano-model.js';

test('new scores use real instruments, valid editable events and independent local state',()=>{
 for(const style of Object.keys(BEAT_DEMOS)){
  const a=createBeatDemoSession(style),b=createBeatDemoSession(style);
  assert.equal(a.bars,16);assert.equal(a.tracks.length,style==='funk'?7:9);
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

test('drill retains every original piano event and its opening bar while adding later depth',()=>{
 const before=JSON.parse(readFileSync(new URL('./fixtures/drill-v2-piano.json',import.meta.url),'utf8'));
 const p=createBeatDemoSession('drill'),piano=p.tracks[3];
 const signature=({id,...note})=>JSON.stringify(note);
 for(const [i,old] of before.entries()){
  const notes=piano.clips[i].notes.map(signature);
  for(const n of old.notes)assert.ok(notes.includes(JSON.stringify(n)),'original piano event changed');
  assert.ok(notes.length>old.notes.length);
 }
 assert.deepEqual(piano.clips[0].notes.filter(n=>n.step<16).map(signature),before[0].notes.filter(n=>n.step<16).map(JSON.stringify));
 for(const id of piano.inserts.filter(Boolean)){
  assert.ok(EFFECTS[id]);assert.equal(piano.effects[id].enabled,true);
 }
 assert.equal(p.bpm,142);assert.equal(p.pianoKey,5);
});

test('the requested Atlanta directions have independent piano/guitar loops and breathing room',()=>{
 const dark=createBeatDemoSession('trap808'),air=createBeatDemoSession('trap-air');
 assert.equal(dark.bpm,140);assert.equal(air.bpm,146);
 assert.equal(dark.tracks[2].type,'piano');assert.equal(air.tracks[2].type,'wlnylon');
 assert.ok(dark.tracks[2].effects.aura.mix>0);assert.ok(air.tracks[2].effects.echo.mix>0);
 assert.notDeepEqual(dark.tracks[2].clips[1].notes.map(n=>n.midi),air.tracks[2].clips[1].notes.map(n=>n.midi));
 for(const p of [dark,air]){
  const snare=p.tracks[0].clips[1].pattern.clap.flatMap((v,i)=>v>.5?[i]:[]);
  assert.deepEqual(snare,[8,24,40,56]);
  assert.ok(p.tracks[4].clips[0].notes.length<=4,'response track must leave room for a vocal');
 }
});

test('Brazilian funk uses a dry, native tamborzao kit with interlocking membrane voices',async()=>{
 const p=createBeatDemoSession('funk'),drums=p.tracks[0];
 assert.equal(p.bpm,130);assert.equal(drums.instrument.kit,4);
 assert.ok(!p.tracks.some(t=>['wljazz','wlmuted','wlclean','keys'].includes(t.type)));
 const pattern=drums.clips[1].pattern;
 assert.deepEqual(pattern.kick.slice(0,16).flatMap((v,i)=>v?[i]:[]),[0,6]);
 assert.deepEqual(pattern.clap.slice(0,16).flatMap((v,i)=>v?[i]:[]),[3,6]);
 assert.deepEqual(pattern.tom.slice(0,16).flatMap((v,i)=>v?[i]:[]),[0,8]);
 assert.equal(pattern.perc[12],.92);assert.equal(pattern.rim[12],.72);
 assert.equal(isRecordedDrumKit(4),false);assert.equal(isRecordedDrumKit(1),true);
 // With only native instruments, preparation must not fetch an acoustic kit.
 const e=new AudioEngine(()=>p,()=>new Map());await e.prepareInstruments({},p);
 assert.equal(e.recordedDrums,undefined);
});

test('relative 808 slides survive normalization, transposition and scheduler handoff',()=>{
 const original={id:'slide-note',step:0,midi:29,len:3,velocity:.8,slide:12};
 const [moved]=moveNotes(normalizeNotes(JSON.parse(JSON.stringify([original])),64),2,5,64);
 assert.equal(moved.midi,34);assert.equal(moved.slide,12);
 const p=createBeatDemoSession('drill'),t=p.tracks[1],events=[];
 p.tracks=[t];t.clips=[{start:0,length:4,patternSteps:64,notes:[moved]}];
 const e=new AudioEngine(()=>p,()=>new Map());e.synth=(...args)=>events.push(args[10]);
 e.scheduleStep({},new Map([[t.id,{input:{}}]]),2,0);
 assert.equal(events[0].slide,12);assert.equal(events[0].midi,34);
});

test('808 scores leave space for release instead of stacking sub notes',()=>{
 for(const style of ['drill','trap808','trap-air']){
  const p=createBeatDemoSession(style),bass=p.tracks.find(t=>t.type==='bass'),releaseSteps=bass.instrument.release*p.bpm/15;
  assert.equal(bass.pan,0);
  assert.ok(bass.instrument.harmonics>.2,'harmonics make the sub readable on smaller speakers');
  for(const c of bass.clips)for(const [i,n] of c.notes.entries()){
   assert.ok(n.midi>=24&&n.midi<=48,'audible sub register');
   assert.ok(n.step+n.len+releaseSteps<=(c.notes[i+1]?.step??64));
  }
 }
});

test('drill 1/32 and Atlanta triplet hats schedule between grid events after JSON round-trip',()=>{
 for(const style of ['drill','trap808','trap-air']){
  const p=JSON.parse(JSON.stringify(createBeatDemoSession(style))),hits=[];
  const engine=new AudioEngine(()=>p,()=>new Map());
  engine.drum=(_ctx,out,voice,time)=>{if(voice==='hat')hits.push({out,time});};engine.synth=()=>{};
  const channels=new Map(p.tracks.map(t=>[t.id,{input:t.name}])),sd=15/p.bpm;
  for(let step=64;step<128;step++)engine.scheduleStep({},channels,step,(step-64)*sd);
  const fills=hits.filter(h=>h.out.startsWith('HI-HAT'));
  assert.ok(fills.length>=8,'roll track must be audible');
  const phases=fills.map(h=>h.time/sd%1);
  if(style==='drill')assert.ok(phases.every(x=>Math.abs(x-.5)<.02));
  else for(const phase of [1/3,2/3])assert.ok(phases.some(x=>Math.abs(x-phase)<.00001),'triplet phase lost after saving');
  const all=hits.map(h=>h.time).sort((a,b)=>a-b);
  assert.ok(all.some((v,i)=>i&&Math.abs((v-all[i-1])/sd-(style==='drill'?.5:2/3))<.02));
 }
});

test('four arrangements have independent scores and section development',()=>{
 const scores=Object.keys(BEAT_DEMOS).map(createBeatDemoSession);
 assert.equal(new Set(scores.map(p=>p.bpm)).size,4);
 assert.equal(new Set(scores.map(p=>JSON.stringify(p.tracks[0].clips[1].pattern))).size,4);
 assert.equal(new Set(scores.map(p=>JSON.stringify(p.tracks[1].clips[1].notes.map(({step,midi,len})=>({step,midi,len}))))).size,4);
 for(const p of scores){
  assert.notDeepEqual(p.tracks[0].clips[0].pattern,p.tracks[0].clips[3].pattern);
  assert.equal(p.demoRevision,3);
 }
});
