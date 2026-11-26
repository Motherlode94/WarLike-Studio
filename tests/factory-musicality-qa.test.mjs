import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_TEMPLATES,createFactorySession} from '../dist/content.js';
import {auditFactoryArrangement,measureFactorySectionAudio} from '../dist/factory-musicality-qa.js';

test('all eighteen factory compositions receive actionable section and mix reports',()=>{
 assert.equal(SESSION_TEMPLATES.length,18);
 for(const {id} of SESSION_TEMPLATES){
  const project=createFactorySession(id,true);
  const report=auditFactoryArrangement(project);
  assert.equal(report.name,project.name);
  assert.equal(report.issues.length,0,id+': '+report.issues.join('; '));
  assert.equal(report.sections.length,project.sections.length,id);
  assert(report.sections.every(s=>s.sounding>0&&s.material>0),id+' missing instruments');
  assert(report.mix.activeTracks>=6,id+' missing arranged music');
  assert(report.mix.master.includes('peak'),id+' no peak protection');
  assert(report.mix.master.includes('balance')&&report.mix.master.includes('press'),id+' needs full mix master');
  assert(report.mix.emptyVoices.length===3,id+' placeholder voices were not supposed to be simulated');
  assert(['structurally-ready','listen-and-review'].includes(report.verdict),id);
  assert(report.sections.some(s=>s.melody),id+' has no answering melody');
 }
});

test('musicality diagnosis catches structural holes without mistaking intended silence for an error',()=>{
 const p=createFactorySession('lumiere',true);
 const original=auditFactoryArrangement(p);
 assert.equal(original.issues.length,0);
 const first=p.sections[0];
 for(const track of p.tracks)track.clips=track.clips.filter(c=>!(c.start<first.start+first.length&&c.start+c.length>first.start));
 const result=auditFactoryArrangement(p);
 assert(result.issues.some(e=>e.includes(first.name)),'silent section must be reported');
 assert.equal(result.verdict,'structural-failure');
 assert.throws(()=>auditFactoryArrangement({}),/invalide/);
});

test('real PCM section analysis measures dynamics and flags silent, clipped or corrupted output',()=>{
 const rate=100,bpm=120,length=800;
 const left=Float32Array.from({length},(_,i)=>i<400?.2:-.3);
 const right=left.slice();
 const project={bpm,sections:[{name:'COUPLET A',start:0,length:2},{name:'REFRAIN A',start:2,length:2}]};
 const buffer={numberOfChannels:2,sampleRate:rate,length,getChannelData:c=>c?right:left};
 const base=measureFactorySectionAudio(buffer,project);
 assert(base.passed);assert.equal(base.sections.length,2);
 assert(base.sections[1].rms>base.sections[0].rms);
 assert(base.sections.every(s=>s.crestDb!==null));
 left[401]=1.2;assert.equal(measureFactorySectionAudio(buffer,project).passed,false);
 left[401]=NaN;assert(measureFactorySectionAudio(buffer,project).problems.includes('REFRAIN A'));
 left[401]=-.3;left.fill(0,0,400);right.fill(0,0,400);
 assert(measureFactorySectionAudio(buffer,project).problems.includes('COUPLET A'));
});
