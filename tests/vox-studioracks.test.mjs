import test from 'node:test';
import assert from 'node:assert/strict';
import {ensurePlugins,EFFECTS} from '../dist/plugins.js';
import {VOX_STUDIORACKS,RACK_CATEGORIES,planVoxStudioRack,rackCapacity,applyVoxStudioRack,shiftVoxStudioInsert,bypassVoxStudioInsert} from '../dist/vox-studioracks.js';
import {GENRE_RACK_CATEGORIES,GENRE_RACK_PRESETS} from '../dist/genre-rack-presets.js';
const track=()=>{const t={id:'test-voice',name:'Lead vocal',type:'audio',clips:[]};ensurePlugins(t);return t;};
test('every VOX STUDIORACKS preset references working registered DSP with bounded values',()=>{
 assert.ok(['trapLead','afroLead','rnbSilk','cleanVoice'].every(id=>VOX_STUDIORACKS[id]));
 assert.ok(Object.keys(VOX_STUDIORACKS).length>=23);
 for(const [key,preset] of Object.entries(VOX_STUDIORACKS)){
  const seen=new Set();assert.ok(preset.stages.length>=3);
  for(const stage of preset.stages){
   assert.ok(EFFECTS[stage.id],key+':'+stage.id);
   assert.ok(!seen.has(stage.id),'duplicate effect in preset');seen.add(stage.id);
   for(const [param,value] of Object.entries(stage.values)){
    const control=EFFECTS[stage.id].controls.find(c=>c.key===param);
    assert.ok(control,key+':'+stage.id+'.'+param);
    assert.ok(Number.isFinite(value)&&value>=control.min&&value<=control.max,key+':'+stage.id+'.'+param);
   }
  }
 }
});
test('rack adds real ordered inserts without changing existing effects',()=>{
 const t=track();t.inserts[0]='color';t.effects.color.enabled=true;t.effects.color.drive=.3;
 const expected=VOX_STUDIORACKS.trapLead.stages.map(s=>s.id);
 const out=applyVoxStudioRack(t,'trapLead');
 assert.deepEqual(out.map(x=>x.id),expected);
 assert.deepEqual(t.inserts.slice(0,expected.length+1),['color',...expected]);
 assert.equal(t.effects.color.drive,.3);assert.equal(t.effects.color.enabled,true);
 assert.equal(t.effects.voxtune.speed,12);
 assert.ok(out.every(x=>t.effects[x.id].enabled));
 assert.equal(t.voxStudioRack.preset,'trapLead');
});
test('rack checks free-slot capacity without mutating a full project',()=>{
 const t=track();for(let i=0;i<t.inserts.length;i++)t.inserts[i]='color__instance'+i;
 const before=structuredClone(t.inserts);
 assert.equal(rackCapacity(t,'rnbSilk').available,0);
 assert.throws(()=>applyVoxStudioRack(t,'rnbSilk'),/inserts libres/);
 assert.deepEqual(t.inserts,before);
});
test('rack controls update the same persisted state as the DAW mixer',()=>{
 const t=track();applyVoxStudioRack(t,'cleanVoice');
 const id=t.inserts[0];
 assert.equal(bypassVoxStudioInsert(t,id),false);assert.equal(t.effects[id].enabled,false);
 assert.equal(bypassVoxStudioInsert(t,id),true);
 const first=t.inserts[0],second=t.inserts[1];
 assert.equal(shiftVoxStudioInsert(t,0,1),true);
 assert.equal(t.inserts[0],second);assert.equal(t.inserts[1],first);
 assert.equal(shiftVoxStudioInsert(t,0,-1),false);
});

test('genre rack offers a complete native chain for every supported musical genre',()=>{
 const genres=new Set(Object.values(GENRE_RACK_PRESETS).map(p=>p.genre));
 assert.deepEqual([...genres].sort(),[...GENRE_RACK_CATEGORIES].sort());
 assert(GENRE_RACK_CATEGORIES.length>=12);
 for(const [genre,preset] of Object.entries(GENRE_RACK_PRESETS)){
  assert.equal(preset.genre,preset.category,genre);
  assert(RACK_CATEGORIES.includes(preset.genre));
  const t=track(),before=structuredClone(t);
  const plan=planVoxStudioRack(t,genre);
  assert.equal(plan.name,preset.name);
  assert.equal(plan.canApply,true,genre);
  assert.equal(plan.required,preset.stages.length);
  assert(plan.stages.length>=3);
  assert.deepEqual(t,before,'preview may not touch the track: '+genre);
  const result=applyVoxStudioRack(t,genre);
  assert.equal(result.length,preset.stages.length);
  assert.deepEqual(result.map(s=>s.id),preset.stages.map(s=>s.id),genre+' order changed');
  for(let i=0;i<result.length;i++){
   const stage=preset.stages[i],installed=t.effects[result[i].id];
   assert.equal(installed.enabled,true);
   for(const [parameter,value] of Object.entries(stage.values))
    assert.equal(installed[parameter],value,genre+' '+stage.id+'.'+parameter);
  }
 }
});
test('rack plan rejects missing capacity without partially installing genre plugins',()=>{
 const t=track();t.inserts=t.inserts.map((_,i)=>i<2?null:'color__instance'+i);
 const before=structuredClone(t);
 const plan=planVoxStudioRack(t,'trapVocal');
 assert.equal(plan.canApply,false);
 assert.equal(plan.available,2);
 assert.throws(()=>applyVoxStudioRack(t,'trapVocal'),/inserts libres/);
 assert.deepEqual(t,before);
 assert.throws(()=>planVoxStudioRack(t,'unknownGenre'),/inconnu/);
});
