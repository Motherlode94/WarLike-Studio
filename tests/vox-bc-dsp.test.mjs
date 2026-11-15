import test from 'node:test';
import assert from 'node:assert/strict';
import {createPackProcessors,syncPackProcessors} from '../dist/pack-audio.js';
import {pluginDefaults,EFFECTS} from '../dist/plugins.js';
import {STUDIO_PRESETS,STUDIO_PACKS} from '../dist/studio-packs.js';

const p=(value=0)=>({value,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
function rig(id,sampleRate=48000){
 const nodes=[],ctx={sampleRate,currentTime:0},make=kind=>{
  const n={kind,context:ctx,links:[],disconnectCount:0,
   connect(to){this.links.push(to);return to;},disconnect(){this.links=[];this.disconnectCount++;}};
  for(const x of ['gain','frequency','Q','delayTime'])n[x]=p();
  if(kind==='createConvolver'){n.buffer=null;n.normalize=true;}
  nodes.push(n);return n;
 };
 for(const k of ['createGain','createBiquadFilter','createDelay','createConvolver'])ctx[k]=()=>make(k);
 ctx.createBuffer=(channels,length,rate)=>({
  channels,length,rate,
  data:Array.from({length:channels},()=>new Float32Array(length)),
  getChannelData(i){return this.data[i];}
 });
 const source=ctx.createGain(),graph=createPackProcessors(ctx,source,source,{detached:true,types:[id]}),module=graph.modules[id];
 assert.ok(module,'DSP missing: '+id);
 const state=structuredClone(pluginDefaults('keys').effects);
 const sync=(patch={},initial=true)=>{Object.assign(state[id],patch);syncPackProcessors({modules:graph.modules,inputChannels:1},state,120,0,initial);};
 return {graph,module,source,nodes,state,sync};
}
for(const id of ['voxaireq','voxambience']){
 test(id+' is a genuine registered processor with parameter-bounded presets',()=>{
  assert.ok(STUDIO_PACKS.voxpro.modules.includes(id));
  assert.ok(EFFECTS[id]);assert.equal(EFFECTS[id].pack,'voxpro');
  assert.equal(STUDIO_PRESETS[id].length,5);
  const defaults=Object.fromEntries(EFFECTS[id].controls.map(c=>[c.key,c.default]));
  const v=rig(id);
  for(const [,values] of STUDIO_PRESETS[id]){
   for(const [key,value] of Object.entries(values)){
    const control=EFFECTS[id].controls.find(c=>c.key===key);
    assert.ok(control,key);
    assert.ok(value>=control.min&&value<=control.max,key);
   }
   v.sync({...defaults,...values,enabled:true},false);
  }
  v.graph.dispose();
 });
 test(id+' obeys bypass and releases owned nodes',()=>{
  const v=rig(id);
  v.sync({enabled:true,mix:.5});
  assert.ok(v.module.wet.gain.value>0);
  v.sync({enabled:false},false);
  assert.equal(v.module.dry.gain.value,1);
  assert.equal(v.module.wet.gain.value,0);
  v.graph.dispose();
  assert.ok(v.nodes.filter(n=>n!==v.source).every(n=>n.disconnectCount>0));
 });
}
test('VOX AIR EQ filters and shelving remain below Nyquist at 8 kHz',()=>{
 const v=rig('voxaireq',8000);
 v.sync({enabled:true,highpass:350,presenceFreq:8000,airFreq:18000,air:9,presence:9,output:6});
 assert.ok(v.module.presence.frequency.value<=3600);
 assert.ok(v.module.air.frequency.value<=3600);
 assert.equal(v.module.air.gain.value,9);
 assert.ok(v.module.highpass.Q.value>.1);
 v.graph.dispose();
});
test('VOX AMBIENCE uses a bounded short IR, safe feedback and known slap time',()=>{
 const v=rig('voxambience');
 v.sync({enabled:true,slap:105,feedback:.45,room:.4,mix:.7});
 assert.equal(v.module.delay.delayTime.value,.105);
 assert.equal(v.module.feedback.gain.value,.45);
 assert.equal(v.module.roomGain.gain.value,.4);
 assert.ok(v.module.convolver.buffer.length>=5000);
 assert.equal(v.module.convolver.buffer.channels,2);
 v.sync({enabled:false},false);
 assert.equal(v.module.feedback.gain.value,0);
 v.graph.dispose();assert.equal(v.module.convolver.buffer,null);
});
