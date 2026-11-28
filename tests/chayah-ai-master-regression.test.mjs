import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAudioBuffer,recommendMastering,applyAIMasterRecommendation,AI_MASTER_STYLES} from '../dist/ai-mix-master.js';
const buffer=(samples,rate=44100)=>({sampleRate:rate,numberOfChannels:2,length:samples.length,getChannelData:()=>samples});
test('CHAYAH AI MASTER rejects a silent pre-master instead of offering empty mastering',()=>{
 const samples=new Float32Array(44100);
 const measurements=analyzeAudioBuffer(buffer(samples),{maxSeconds:1});
 assert.equal(measurements.rmsDbfs,-120);
 assert.throws(()=>recommendMastering(measurements,{style:'rock'}),/silencieux|faible/);
});
test('CHAYAH AI MASTER returns finite reviewable settings for an audible mix',()=>{
 const samples=Float32Array.from({length:44100},(_,i)=>.2*Math.sin(i*440*2*Math.PI/44100));
 const m=analyzeAudioBuffer(buffer(samples),{maxSeconds:1});
 assert.ok(m.rmsDbfs>-25);
 for(const style of ['transparent','rap','afro','rnb','rock']){
  assert.ok(AI_MASTER_STYLES[style]);
  const suggestion=recommendMastering(m,{style});
  assert.equal(suggestion.requiresApproval,true);
  assert.deepEqual(suggestion.mastering.inserts.slice(0,3),['balance','press','peak']);
  assert.ok(suggestion.mastering.peak.enabled);
  assert.ok(suggestion.mastering.peak.ceiling<0);
  const project={mastering:{inserts:[]}};
  assert.throws(()=>applyAIMasterRecommendation(project,suggestion),/non confirmée/);
  applyAIMasterRecommendation(project,suggestion,{confirm:true});
  assert.ok(project.mastering.inserts.includes('peak'));
 }
});
test('CHAYAH UI analysis renders only pre-master project and reports errors in the panel',async()=>{
 const {readFileSync}=await import('node:fs');
 const ui=readFileSync(new URL('../dist/divinity-ui.js',import.meta.url),'utf8');
 assert.ok(ui.includes('mastering:{...source.mastering,bypass:true}'));
 assert.ok(ui.includes('project:dryMasterProject'));
 assert.ok(ui.includes('endBar:Math.min(32,bars)'));assert.ok(ui.includes('refineMasteringForTarget'));
 assert.ok(ui.includes('role="alert"'));
 assert.ok(ui.includes('chosenStyle'));
 assert.ok(ui.includes('button.disabled=true'));
});
