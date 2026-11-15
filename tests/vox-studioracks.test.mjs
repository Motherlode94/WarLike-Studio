import test from 'node:test';
import assert from 'node:assert/strict';
import {ensurePlugins,EFFECTS} from '../dist/plugins.js';
import {VOX_STUDIORACKS,rackCapacity,applyVoxStudioRack,shiftVoxStudioInsert,bypassVoxStudioInsert} from '../dist/vox-studioracks.js';
const track=()=>{const t={id:'test-voice',name:'Lead vocal',type:'audio',clips:[]};ensurePlugins(t);return t;};
test('every VOX STUDIORACKS preset references working registered DSP with bounded values',()=>{
 assert.deepEqual(Object.keys(VOX_STUDIORACKS),['trapLead','afroLead','rnbSilk','cleanVoice']);
 for(const [key,preset] of Object.entries(VOX_STUDIORACKS)){
  const seen=new Set();assert.ok(preset.stages.length>=4);
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
