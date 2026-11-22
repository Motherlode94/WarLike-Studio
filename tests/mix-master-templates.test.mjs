import test from 'node:test';
import assert from 'node:assert/strict';
import {MIX_TEMPLATES,MASTER_TEMPLATES,validateTemplate,mixTemplatePreview,masterTemplatePreview,applyMixTemplate,applyMasterTemplate} from '../dist/mix-master-templates.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert,ensurePlugins,INSERT_COUNT} from '../dist/plugins.js';
import {emptyProject} from '../dist/audio.js';
import {masteringSettings} from '../dist/mastering.js';

test('mix and master templates reference genuine engines and valid DSP ranges',()=>{
 assert.ok(MIX_TEMPLATES.length>=20);
 assert.ok(MASTER_TEMPLATES.length>=10);
 const keys=new Set();
 for(const t of MIX_TEMPLATES){assert.ok(!keys.has(t.id),'duplicate mix template '+t.id);keys.add(t.id);assert.equal(validateTemplate(t,'mix'),true);assert.ok(mixTemplatePreview(t).includes('01 ·'));}
 keys.clear();
 for(const t of MASTER_TEMPLATES){assert.ok(!keys.has(t.id),'duplicate master template '+t.id);keys.add(t.id);assert.equal(validateTemplate(t,'master'),true);assert.ok(masterTemplatePreview(t).length>5);}
});
test('track replace only changes insert chain and is undo-friendly',()=>{
 const track=createContentTrack('lead');ensurePlugins(track);
 track.clips=[{id:'keep',notes:[{midi:60}]}];track.volume=-12;track.pan=.2;track.output='bus1';
 placeInsert(track,0,'glue');track.effects.glue.threshold=-21;
 const before=structuredClone(track),preset=MIX_TEMPLATES.find(t=>t.id==='trap-vocal');
 applyMixTemplate(track,preset,{mode:'replace'});
 assert.deepEqual(track.clips,before.clips);assert.equal(track.volume,-12);assert.equal(track.pan,.2);assert.equal(track.output,'bus1');
 assert.deepEqual(track.inserts.filter(Boolean).map(x=>x.split('__')[0]),preset.stages.map(x=>x.id));
 assert.equal(track.effects.glue.enabled,false);assert.equal(track.effects.voxclean.enabled,true);
});
test('append preserves existing effects and permits multiple instances by native IDs',()=>{
 const track=createContentTrack('lead');ensurePlugins(track);placeInsert(track,0,'voxclean');
 const preset=MIX_TEMPLATES.find(t=>t.id==='trap-vocal');
 const before=structuredClone(track);
 applyMixTemplate(track,preset,{mode:'append'});
 assert.equal(track.inserts[0],'voxclean');assert.deepEqual(track.effects.voxclean,before.effects.voxclean);
 assert.equal(track.inserts.filter(Boolean).length,1+preset.stages.length);
 assert.equal(new Set(track.inserts.filter(Boolean)).size,1+preset.stages.length);
});
test('reject a full rack without mutating the track',()=>{
 const track=createContentTrack('lead');ensurePlugins(track);
 for(let i=0;i<INSERT_COUNT;i++)placeInsert(track,i,'glue');
 const before=structuredClone(track);
 assert.throws(()=>applyMixTemplate(track,MIX_TEMPLATES[0],{mode:'append'}),/Pas assez/);
 assert.deepEqual(track,before);
});
test('master templates alter master only, keep ordered modules and bypass false',()=>{
 const project=emptyProject(),original=structuredClone(project.tracks);
 for(const t of MASTER_TEMPLATES){
  applyMasterTemplate(project,t);
  assert.deepEqual(project.tracks,original,'master template modified tracks');
  assert.equal(project.mastering.bypass,false);
  const planned=t.stages?.map(x=>x.id)||Object.keys(t.settings).filter(id=>t.settings[id]?.enabled===true);
  assert.deepEqual(project.mastering.inserts.filter(Boolean),planned);
  for(const id of planned)assert.equal(project.mastering[id].enabled,true);
  assert.deepEqual(project.mastering,masteringSettings(project.mastering));
 }
});
