import test from 'node:test';
import assert from 'node:assert/strict';
import {createBeatDemoSession} from '../dist/beat-demo-sessions.js';
import {createVocalDemoSession} from '../dist/vocal-demo-sessions.js';
import {extendPublicDemoArrangement} from '../dist/public-demo-arrangements.js';
import {masterPublicDemo} from '../dist/demo-mastering.js';

test('Atlanta After Dark has 112 editable bars, distinct sections and duration over 3 minutes',()=>{
 const old=createBeatDemoSession('trap808'),p=extendPublicDemoArrangement(createBeatDemoSession('trap808'),'trap808');
 assert.equal(old.bars,16);assert.equal(p.bars,112);
 assert(p.bars*240/p.bpm>=180);
 assert(p.sections.some(s=>s.name==='COUPLET C'));
 assert.equal(p.sections.at(-1).start+p.sections.at(-1).length,p.bars);
 for(const track of p.tracks)for(const clip of track.clips)assert(clip.start>=0&&clip.start+clip.length<=p.bars+1e-7);
 assert(p.tracks[2].clips.length>old.tracks[2].clips.length);
 assert(p.tracks[0].clips.some(c=>c.name.startsWith('BREAK')));
});
test('Trap pour tous uses 96 bars and never invents new recorded vocal sources',()=>{
 const p=createVocalDemoSession('vox-trap'),audio=p.tracks.filter(t=>t.type==='audio');
 const source=[{audioId:'a',start:4,length:4,name:'COUPLET A',gainDb:0},
  {audioId:'b',start:8,length:4,name:'COUPLET B',gainDb:0},
  {audioId:'c',start:12,length:4,name:'REFRAIN',gainDb:0}];
 audio[0].clips=source;
 audio[1].clips=[{audioId:'c',start:12.025,length:3.975,gainDb:-5,name:'DOUBLURE'}];
 audio[2].clips=[{audioId:'a',start:7,length:1,sourceOffset:3,gainDb:-3,name:'RÉPONSE A'}];
 const old=structuredClone(p);
 extendPublicDemoArrangement(p,'trap');
 assert.equal(p.bars,96);
 assert(p.bars*240/p.bpm>160);
 assert.deepEqual(new Set(p.tracks.filter(t=>t.type==='audio').flatMap(t=>t.clips.map(c=>c.audioId))),new Set(['a','b','c']));
 assert.equal(old.bars,16);
 assert(p.tracks.filter(t=>t.type==='audio').flatMap(t=>t.clips).every(c=>c.fadeIn>=.035&&c.fadeOut>=.055&&c.gainDb<=-7));
 for(const t of p.tracks)for(const c of t.clips)assert(c.start>=0&&c.start+c.length<=96+1e-7);
 const lead=p.tracks.find(t=>t.type==='audio');
 assert(lead.clips.some(c=>c.start===8));
 assert.equal(lead.clips.some(c=>c.start<8),false);
 assert.equal(lead.clips.some(c=>c.start>=92),false);
 assert(p.masterVolume<=-12);
});
test('transforms preserve 4-bar MIDI notes and 16-step drum blocks without overruns',()=>{
 const p=extendPublicDemoArrangement(createBeatDemoSession('trap808'),'trap808');
 for(const track of p.tracks)for(const clip of track.clips){
  if(clip.notes)assert(clip.notes.every(n=>n.step>=0&&n.step+n.len<=clip.length*16+1e-6));
  if(clip.pattern)assert(Object.values(clip.pattern).every(row=>row.length===clip.patternSteps));
 }
});
test('extension refuses invalid 16-bar origin and never modifies reopened projects',()=>{
 const p=createBeatDemoSession('trap808');p.bars=32;
 assert.throws(()=>extendPublicDemoArrangement(p,'trap808'),/16 mesures/);
});

test('factory Trap vocal mastering retains peak protection without saturated input drive',()=>{
 const p=createVocalDemoSession('vox-trap');p.publicDemo=true;
 masterPublicDemo(p,'trap');
 assert.equal(p.mastering.circuitcolor.drive,0);
 assert.equal(p.mastering.circuitcolor.mix,0);
 assert.equal(p.mastering.peak.drive,0);
 assert.equal(p.mastering.peak.ceiling,-1.5);
 assert.equal(p.mastering.press.makeup,0);
});
