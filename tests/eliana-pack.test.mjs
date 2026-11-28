import test from 'node:test';
import assert from 'node:assert/strict';
import {ELIANA_EFFECTS,ELIANA_PRESETS,ELIANA_PACK} from '../dist/eliana-pack.js';
import {EFFECTS,ensurePlugins} from '../dist/plugins.js';
import {FACTORY_PRESETS,applyFactoryPreset,exportRack,importRack} from '../dist/bundle.js';
import {effectFace,effectHardwareIdentity} from '../dist/effect-face-model.js';
import {createElianaEffects,syncElianaEffect} from '../dist/eliana-audio.js';

const ids=['elianaveil','elianaembrace','eliananest','elianaguard'];
test('ELIANA registers exactly four separate soft effects with factory presets and UI identities',()=>{
 assert.deepEqual(Object.keys(ELIANA_EFFECTS),ids);
 assert.deepEqual(ELIANA_PACK.modules,ids);
 for(const id of ids){
  assert.equal(EFFECTS[id],ELIANA_EFFECTS[id]);
  assert.equal(ELIANA_PRESETS[id].length,3);
  assert.equal(FACTORY_PRESETS[id].length,3);
  const t={type:'audio',clips:[]};ensurePlugins(t);
  applyFactoryPreset(t,id,1);
  assert(t.inserts.includes(id));assert(t.effects[id].enabled);
  const panel=effectFace(id,EFFECTS[id]),keys=EFFECTS[id].controls.map(c=>c.key);
  assert.deepEqual(panel.groups.flatMap(x=>x.keys).sort(),keys.slice().sort());
  assert(effectHardwareIdentity(id,EFFECTS[id]).engraving);
  for(const c of EFFECTS[id].controls)assert(t.effects[id][c.key]>=c.min&&t.effects[id][c.key]<=c.max,id+' '+c.key);
  const rack=exportRack(t),restored={type:'audio',clips:[]};ensurePlugins(restored);importRack(restored,rack);
  assert.deepEqual(restored.effects[id],t.effects[id]);
 }
});
function mock(){
 const sources=[];const param=()=>({value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
 const ctx={sampleRate:44100};
 const node=kind=>{const n={context:ctx,kind,gain:param(),frequency:param(),Q:param(),threshold:param(),ratio:param(),attack:param(),release:param(),knee:param(),delayTime:param(),connect(){},disconnect(){}};sources.push(n);return n;};
 for(const key of ['createGain','createBiquadFilter','createDelay'])ctx[key]=()=>node(key);
 return {ctx,scope:{node:(kind,...args)=>ctx[kind](...args)},sources};
}
test('ELIANA native EQ and room graphs synchronize mix and stop disabled feedback',()=>{
 const {ctx,scope}=mock(),modules=createElianaEffects(ctx,scope,['elianaveil','eliananest']);
 assert.deepEqual(Object.keys(modules),['elianaveil','eliananest']);
 for(const id of Object.keys(modules)){
  const t={type:'audio',clips:[]};ensurePlugins(t);
  Object.assign(t.effects[id],ELIANA_PRESETS[id][0][1],{enabled:true});
  assert.doesNotThrow(()=>syncElianaEffect(id,modules[id],t.effects[id],0,true));
  assert(modules[id].wet.gain.value>0);
  t.effects[id].enabled=false;syncElianaEffect(id,modules[id],t.effects[id],0,true);
  assert.equal(modules[id].wet.gain.value,0);
  assert.equal(modules[id].dry.gain.value,1);
 }
 assert(modules.eliananest.feedback.gain.value===0,'disabled feedback must stop repeats');
});
