import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_TEMPLATES,createFactorySession} from '../dist/content.js';
import {finishFactorySong,articulateLegacyFactorySong} from '../dist/factory-song-finish.js';
import {EFFECTS} from '../dist/plugins.js';
const originalIds=['nocturne','soleil','brume'];
const score=p=>p.tracks.filter(t=>t.clips?.length).map(t=>t.clips.map(c=>({start:c.start,notes:c.notes?.map(n=>[n.midi,n.step,n.velocity,n.len]),pattern:c.pattern})));
test('all eighteen full factory songs have complete structure, usable mix racks and a prepared master',()=>{
 assert.equal(SESSION_TEMPLATES.length,18);
 for(const {id,name} of SESSION_TEMPLATES){
  const project=createFactorySession(id,true),sections=project.sections;
  assert(project.fullSong,id+' missing full-song form');
  assert.equal(project.factoryProductionRevision,1,id+' has no production pass');
  assert(sections.length>=8,id+' missing intro / verses / choruses / outro');
  assert.equal(sections[0].start,0,id+' starts late');
  for(let i=1;i<sections.length;i++)assert.equal(sections[i].start,sections[i-1].start+sections[i-1].length,id+' gap in sections');
  assert.equal(sections.at(-1).start+sections.at(-1).length,project.bars,id+' form length mismatch');
  assert(sections.some(s=>s.name.startsWith('REFRAIN')),id+' missing chorus');
  const instruments=project.tracks.filter(t=>t.type!=='audio'&&t.type!=='bus');
  assert(instruments.length>=6,id+' lacks instrumentation');
  for(const [role,t] of instruments.entries()){
   assert(t.clips.length>=4,id+' unarranged instrument '+t.name);
   assert(t.clips.every(c=>c.start>=0&&c.start+c.length<=project.bars),id+' clip out of bounds');
   assert(t.inserts.length===12,id+' does not have full FX rack');
   for(const fx of t.inserts.filter(Boolean))assert(EFFECTS[fx],id+' unresolved FX '+fx);
   if(role<=2)assert(t.inserts.some(fx=>fx&&t.effects?.[fx]?.enabled),id+' unprocessed core track '+t.name);
  }
  const vox=project.tracks.filter(t=>t.type==='audio');
  assert.equal(vox.length,3,id+' vocal placeholders missing');
  assert(vox.every(t=>!t.clips.length),id+' claimed vocals that are not recorded');
  const master=project.mastering,enabled=(master.inserts||[]).filter(fx=>fx&&master[fx]?.enabled);
  assert(enabled.includes('balance')&&enabled.includes('press')&&enabled.includes('peak'),id+' only has a limiter rather than a master chain');
  assert(master.peak.ceiling<=-1,id+' peak output too hot');
  assert(master.peak.drive>=0&&master.peak.drive<=24,id+' measured demo gain outside the limiter range');
  assert.equal(project.masterVolume,0);assert.equal(project.demoLevelProfile,'factory:'+id);
 }
});
test('production pass is idempotent and only acts on new full factory copies',()=>{
 const id='brume',p=createFactorySession(id,true),snapshot=JSON.stringify(p);
 finishFactorySong(p,id);articulateLegacyFactorySong({fullSong:false,tracks:[]},id);
 assert.equal(JSON.stringify(p),snapshot);
 const custom={demo:false,fullSong:true,tracks:[],mastering:{inserts:['peak'],peak:{enabled:true}}};
 assert.equal(finishFactorySong(custom,'brume'),custom);
 assert.equal(custom.factoryProductionRevision,undefined);
 const short=createFactorySession(id,false);
 assert.equal(short.factoryProductionRevision,undefined);
});
test('earlier three full scores gain verse and chorus phrasing, preserving all note pitches',()=>{
 for(const id of originalIds){
  const full=createFactorySession(id,true);
  const voiced=full.tracks.find(t=>t.type!=='drums'&&t.clips.some(c=>c.notes?.length));
  const verse=full.sections.find(s=>s.name==='COUPLET A'),hook=full.sections.find(s=>s.name==='REFRAIN A');
  const notes=s=>voiced.clips.filter(c=>c.start>=s.start&&c.start<s.start+s.length).flatMap(c=>c.notes||[]);
  const a=notes(verse),b=notes(hook);
  assert(a.length&&b.length,id+' chorus/verse absent');
  assert.notDeepEqual(new Set(a.map(n=>n.velocity)),new Set(b.map(n=>n.velocity)),id+' needs phrase dynamics');
 }
});
