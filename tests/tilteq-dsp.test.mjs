import test from 'node:test';
import assert from 'node:assert/strict';
import {createPackProcessors,syncPackProcessors} from '../dist/pack-audio.js';
import {pluginDefaults} from '../dist/plugins.js';

function param(value=0){return {value,setValueAtTime(next){this.value=next;},setTargetAtTime(next){this.value=next;}};}
function fakeContext(){
  const ctx={nodes:[],currentTime:0};
  function node(kind){
    const n={kind,context:ctx,connections:[],connect(dest){this.connections.push(dest);return dest;},disconnect(){this.connections=[];}};
    for(const key of ['gain','frequency','Q','delayTime','pan'])n[key]=param();
    if(kind==='createOscillator')Object.assign(n,{start(){},stop(){}});
    ctx.nodes.push(n);return n;
  }
  for(const kind of ['createGain','createBiquadFilter','createDelay','createStereoPanner','createOscillator','createWaveShaper','createAnalyser'])ctx[kind]=()=>node(kind);
  return ctx;
}
function rack(){
  const ctx=fakeContext(),input=ctx.createGain();
  const graph=createPackProcessors(ctx,input,input,{detached:true,types:['tilteq']});
  return {ctx,graph,m:graph.modules.tilteq};
}
test('existing TILT EQ is a real two-shelf signal chain with output trim',()=>{
  const {m,graph}=rack();
  assert.ok(m);
  assert.equal(m.low.type,'lowshelf');
  assert.equal(m.high.type,'highshelf');
  assert.ok(m.input.connections.includes(m.low));
  assert.ok(m.low.connections.includes(m.high));
  assert.ok(m.high.connections.includes(m.trim));
  assert.ok(m.trim.connections.includes(m.blend.wet));
  assert.ok(m.blend.wet.connections.includes(m.output));
  graph.dispose();
});
test('TILT EQ controls change actual Web Audio parameters and bypass mutes wet path',()=>{
  const {ctx,graph,m}=rack();
  const effects=pluginDefaults('keys').effects;
  effects.tilteq={...effects.tilteq,enabled:true,tilt:5,pivot:1200,output:-6,mix:1};
  syncPackProcessors({modules:graph.modules},effects,120,ctx.currentTime,true);
  assert.equal(m.low.frequency.value,1200);
  assert.equal(m.high.frequency.value,1200);
  assert.equal(m.low.gain.value,-5);
  assert.equal(m.high.gain.value,5);
  assert.ok(Math.abs(m.trim.gain.value-10**(-6/20))<1e-6);
  assert.equal(m.blend.dry.gain.value,0);
  assert.equal(m.blend.wet.gain.value,1);
  effects.tilteq.enabled=false;
  syncPackProcessors({modules:graph.modules},effects,120,ctx.currentTime,true);
  assert.equal(m.blend.dry.gain.value,1);
  assert.equal(m.blend.wet.gain.value,0);
  graph.dispose();
});
