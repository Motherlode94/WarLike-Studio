import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS} from '../dist/plugins.js';
import {DIVINITY_BUNDLES,divinityBundlePreview,applyDivinityBundle} from '../dist/divinity-bundles.js';
import {analyzeAudioBuffer,recommendMastering,applyAIMasterRecommendation,AI_MASTER_STYLES} from '../dist/ai-mix-master.js';

test('each themed bundle uses real installed effects and bounded controls',()=>{
  assert.equal(Object.keys(DIVINITY_BUNDLES).length,12);
  for(const id of Object.keys(DIVINITY_BUNDLES)){
    const bundle=divinityBundlePreview(id,EFFECTS);
    assert.ok(bundle.chain.length>0);
    for(const {type,settings} of bundle.chain){
      for(const c of EFFECTS[type].controls)assert.ok(settings[c.key]>=c.min&&settings[c.key]<=c.max);
    }
  }
});
test('bundle applications require approval and do not replace existing effects',()=>{
  const track={inserts:Array(12).fill(null),effects:{existing:{enabled:true}}};
  assert.throws(()=>applyDivinityBundle({},track,'shango',EFFECTS));
  const spec=applyDivinityBundle({},track,'shango',EFFECTS,{confirm:true});
  assert.equal(track.inserts.filter(Boolean).length,spec.chain.length);
  assert.equal(track.effects.existing.enabled,true);
  const snapshot=structuredClone(track);
  track.inserts.fill('occupied',4);
  const before=structuredClone(track);
  assert.throws(()=>applyDivinityBundle({},track,'ogun',EFFECTS,{confirm:true}));
  assert.deepEqual(track,before);
  assert.equal(snapshot.inserts[0].startsWith('voxclean__'),true);
});
test('AI mastering works on finite PCM without uploading and only applies with approval',()=>{
  const sampleRate=48000,samples=new Float32Array(sampleRate);
  for(let i=0;i<samples.length;i++)samples[i]=Math.sin(i*2*Math.PI*440/sampleRate)*.25;
  const data={sampleRate,numberOfChannels:1,length:samples.length,getChannelData:()=>samples};
  const m=analyzeAudioBuffer(data);
  assert.ok(m.samplePeakDbfs<-11&&m.samplePeakDbfs>-13);
  assert.equal(m.stereoCorrelation,null);
  const project={mastering:{original:true}};
  for(const style of Object.keys(AI_MASTER_STYLES)){
    const rec=recommendMastering(m,{style});
    assert.equal(rec.requiresApproval,true);
    assert.throws(()=>applyAIMasterRecommendation(project,rec));
    assert.deepEqual(project.mastering,{original:true});
    applyAIMasterRecommendation(project,rec,{confirm:true});
    assert.ok(project.mastering.inserts.includes('peak'));
  }
});
