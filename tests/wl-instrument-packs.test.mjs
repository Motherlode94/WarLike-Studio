import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS,ensurePlugins} from '../dist/plugins.js';
import {FACTORY_PRESETS} from '../dist/bundle.js';
import {GUITAR_INSTRUMENTS,SYNTH_INSTRUMENTS,HERITAGE_PACK,GUITAR_PACK,SYNTH_PACKS} from '../dist/wl-instrument-packs.js';
import {warlikeInstrumentVoice} from '../dist/wl-instrument-voices.js';
import {createFactorySession} from '../dist/content.js';
import {NATIVE_CHAINS} from '../dist/native-vocal-chains.js';

function setup(){
 const started=[],stopped=[],nodes=[],param=(v=0)=>({value:v,setValueAtTime(x){this.value=x;},linearRampToValueAtTime(x){this.value=x;},setTargetAtTime(x){this.value=x;}});
 const ctx={sampleRate:48000,currentTime:0,createBuffer(channels,length,rate){
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {length,channels,sampleRate:rate,duration:length/rate,copyToChannel(a,i){data[i].set(a)},getChannelData(i){return data[i]}};
 }};
 const make=kind=>{const n={kind,frequency:param(440),detune:param(0),gain:param(1),Q:param(.7),pan:param(0),links:[],connect(to){this.links.push(to);return to;},disconnect(){this.links=[]},start(t){started.push({kind,t});},stop(t){stopped.push({kind,t})}};nodes.push(n);return n;};
 for(const k of ['createGain','createBufferSource','createBiquadFilter','createOscillator','createStereoPanner','createWaveShaper'])ctx[k]=()=>make(k);
 const scope={node(name){if(!ctx[name])throw Error('Missing '+name);return ctx[name]()},watch(source){assert.ok(source)}};
 return {ctx,scope,nodes,started,stopped};
}
test('seven modeled guitars and three independent synth instruments are registered, with valid own presets',()=>{
 assert.equal(Object.keys(GUITAR_INSTRUMENTS).length,7);
 assert.equal(Object.keys(SYNTH_INSTRUMENTS).length,3);
 assert.equal(new Set(Object.values(GUITAR_INSTRUMENTS).map(x=>x.style)).size,7);
 for(const [id,def] of Object.entries({...GUITAR_INSTRUMENTS,...SYNTH_INSTRUMENTS})){
  assert.equal(INSTRUMENTS[id].name,def.name);
  assert.equal(FACTORY_PRESETS[id].length,3);
  for(const preset of FACTORY_PRESETS[id])for(const [key,value] of Object.entries(preset.values)){
   const c=def.controls.find(x=>x.key===key);
   assert.ok(c,id+'.'+key);assert.ok(value>=c.min&&value<=c.max,id+'.'+key);
  }
 }
 assert.deepEqual(GUITAR_PACK.instruments,Object.keys(GUITAR_INSTRUMENTS));
 assert.deepEqual(Object.keys(SYNTH_PACKS),['wlatlas','wlvanguard','wlnebula']);
 assert.ok(HERITAGE_PACK.modules.includes('circuitbus'));
});
test('every new instrument creates actual timed Web Audio sources',()=>{
 for(const id of Object.keys({...GUITAR_INSTRUMENTS,...SYNTH_INSTRUMENTS})){
  const env=setup(),out=env.ctx.createGain();
  assert.equal(warlikeInstrumentVoice(env.ctx,out,id,60,.1,.5,{},.8,env.scope),true,id);
  assert.ok(env.started.length>0,id+' silent: no active source');
  assert.equal(env.stopped.length,env.started.length,id+' source leak');
  assert.ok(env.nodes.some(n=>n.links.length),'no audio routing '+id);
  if(id==='wlcrunch')assert.ok(env.nodes.some(n=>n.kind==='createWaveShaper'&&n.curve?.length>0),'no real amplifier saturation');
  if(id==='wlspectral')assert.ok(env.nodes.some(n=>n.kind==='createOscillator'&&n.links.some(x=>x.kind==='createGain')),'missing FM oscillator');
 }
});
test('new instruments are absent from all existing factory demo tracks',()=>{
 for(const demo of ['nocturne','soleil','brume']){
  const p=createFactorySession(demo);
  assert.ok(p.tracks.every(t=>!Object.hasOwn(GUITAR_INSTRUMENTS,t.type)&&!Object.hasOwn(SYNTH_INSTRUMENTS,t.type)));
  assert.equal(p.tracks.length,9);
 }
 for(const id of Object.keys({...GUITAR_INSTRUMENTS,...SYNTH_INSTRUMENTS})){
  const tr={id,type:id,clips:[]};ensurePlugins(tr);assert.ok(tr.instrument);
 }
});
test('original Heritage chain presets contain only existing effects and need no vendor data',()=>{
 for(const key of ['heritageTracking','heritageRoom','heritageMix']){
  const chain=NATIVE_CHAINS[key];assert.ok(chain);
  for(const eff of chain.effects){
   assert.ok(eff.id);
   // The heritage pack is a chain of built-in DSP modules.
   assert.ok(HERITAGE_PACK.modules.includes(eff.id),key+':'+eff.id);
  }
 }
});
