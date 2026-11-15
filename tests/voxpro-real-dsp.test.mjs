import test from 'node:test';
import assert from 'node:assert/strict';
import {createPackProcessors,syncPackProcessors} from '../dist/pack-audio.js';
import {pluginDefaults,EFFECTS} from '../dist/plugins.js';
import {STUDIO_PRESETS} from '../dist/studio-packs.js';

function mockContext(sampleRate=48000){
 const nodes=[],oscillators=[];
 const param=(value=0)=>({value,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
 const ctx={sampleRate,currentTime:0};
 function node(kind){
  const n={kind,context:ctx,links:[],disconnectCalls:0,connect(to){this.links.push(to);return to;},disconnect(){this.disconnectCalls++;this.links=[];}};
  for(const k of ['gain','frequency','Q','pan','delayTime'])n[k]=param();
  if(kind==='createOscillator'){n.start=()=>{n.started=true};n.stop=()=>{n.stopped=true};oscillators.push(n);}
  nodes.push(n);return n;
 }
 for(const name of ['createGain','createBiquadFilter','createWaveShaper','createDelay','createStereoPanner','createOscillator'])ctx[name]=()=>node(name);
 return {ctx,nodes,oscillators};
}
function rig(id,sampleRate=48000){
 const {ctx,nodes,oscillators}=mockContext(sampleRate),input=ctx.createGain();
 const graph=createPackProcessors(ctx,input,input,{detached:true,types:[id]});
 const state=structuredClone(pluginDefaults('keys').effects);
 const module=graph.modules[id];assert.ok(module,id+' missing Web Audio DSP graph');
 const sync=(patch={},initial=true)=>{Object.assign(state[id],patch);syncPackProcessors({modules:graph.modules,inputChannels:1},state,120,ctx.currentTime,initial);};
 return {graph,module,nodes,oscillators,sync,state,input};
}
test('new vocal module ids match the persisted registry and provide factory presets',()=>{
 for(const id of ['voxmicmodel','voxwarm','voxdoubler']){
  assert.ok(EFFECTS[id]);assert.equal(EFFECTS[id].pack,'voxpro');
  assert.equal(STUDIO_PRESETS[id].length,5);
  for(const [,values] of STUDIO_PRESETS[id])for(const [key,value] of Object.entries(values)){
   const control=EFFECTS[id].controls.find(c=>c.key===key);
   assert.ok(control,id+':'+key);assert.ok(value>=control.min&&value<=control.max,id+':'+key);
  }
 }
});
test('VOX MIC COLOR clamps filter frequencies and bypass restores the dry path',()=>{
 const v=rig('voxmicmodel',8000);
 v.sync({enabled:true,mix:1,source:0,target:1,air:5,presence:3,proximity:2});
 assert.ok(v.module.air.frequency.value<=3600);
 assert.ok(v.module.presence.frequency.value<=3600);
 assert.ok(v.module.presence.Q.value>.1);
 assert.equal(v.module.wet.gain.value,1);
 v.sync({enabled:false},false);
 assert.equal(v.module.wet.gain.value,0);assert.equal(v.module.dry.gain.value,1);
 v.graph.dispose();assert.ok(v.nodes.filter(n=>n!==v.input).every(n=>n.disconnectCalls>0));
});
test('VOX WARM generates finite centered curve and bypass does not apply output trim to dry',()=>{
 const v=rig('voxwarm');v.sync({enabled:true,mix:1,drive:12,bias:.4,output:-12});
 assert.equal(v.module.shaper.oversample,'4x');
 const curve=v.module.shaper.curve;assert.equal(curve.length,4097);assert.equal(curve[2048],0);
 assert.ok(curve.every(Number.isFinite));
 assert.ok(v.module.level.gain.value<.3);
 assert.equal(v.module.wet.gain.value,1);
 v.sync({enabled:false},false);
 assert.equal(v.module.dry.gain.value,1);assert.equal(v.module.wet.gain.value,0);
 assert.ok(v.module.dry.links.includes(v.module.output),'dry must bypass the output trim');
 v.graph.dispose();assert.equal(v.module.shaper.curve,null);
});
test('VOX DOUBLER limits modulation below delay and stops its LFOs on teardown',()=>{
 const v=rig('voxdoubler');
 v.sync({enabled:true,mix:.7,delay:8,detune:30,width:1,voices:4});
 assert.equal(v.oscillators.length,2);
 for(const voice of v.module.voices){assert.ok(voice.delay.delayTime.value- Math.abs(voice.depth.gain.value)>=.001-1e-9);}
 assert.equal(v.module.wet.gain.value,.7);
 v.sync({enabled:false},false);assert.equal(v.module.wet.gain.value,0);assert.equal(v.module.dry.gain.value,1);
 v.graph.dispose();assert.ok(v.oscillators.every(osc=>osc.stopped));
 assert.ok(v.nodes.filter(n=>n!==v.input).every(n=>n.disconnectCalls>0));
});
test('all three new processor instances can be repeatedly created and disposed',()=>{
 for(let cycle=0;cycle<5;cycle++)for(const id of ['voxmicmodel','voxwarm','voxdoubler']){
  const v=rig(id);v.sync({enabled:true});v.graph.dispose();assert.ok(v.nodes.filter(n=>n!==v.input).every(n=>n.disconnectCalls>0));
 }
});
