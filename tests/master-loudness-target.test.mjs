import test from 'node:test';
import assert from 'node:assert/strict';
import {LOUDNESS_TARGETS,recommendMastering,refineMasteringForTarget} from '../dist/ai-mix-master.js';

const quietMix={samplePeakDbfs:-16,rmsDbfs:-30,crestDb:14,dcOffset:0,clippedFraction:0,stereoCorrelation:.9,integratedLufs:-33};

test('delivery targets follow common platform levels',()=>{
  assert.equal(LOUDNESS_TARGETS.streaming.lufs,-14);assert.equal(LOUDNESS_TARGETS.streaming.truePeak,-1);
  assert.equal(LOUDNESS_TARGETS.apple.lufs,-16);assert.equal(LOUDNESS_TARGETS.none.lufs,null);
});

test('a quiet mix receives the limiter gain needed to reach the target',()=>{
  const p=recommendMastering(quietMix,{style:'rap',target:LOUDNESS_TARGETS.streaming});
  assert.equal(p.mastering.peak.drive,19,'-33 LUFS to -14 LUFS');
  assert.ok(p.mastering.peak.ceiling<=-1.5,'sample ceiling leaves room under -1 dBTP');
  assert.equal(p.target.lufs,-14);
});

test('without a target the historical cautious proposal is unchanged',()=>{
  const p=recommendMastering(quietMix,{style:'rap'});
  assert.ok(p.mastering.peak.drive<=3);assert.equal(p.target,null);
});

test('refinement corrects the measured loudness error and true-peak overshoot',()=>{
  const p=recommendMastering(quietMix,{style:'transparent',target:LOUDNESS_TARGETS.streaming});
  const r=refineMasteringForTarget(p,{integrated:-16,truePeakDb:-.4});
  assert.equal(r.mastering.peak.drive,p.mastering.peak.drive+2);
  assert.ok(r.mastering.peak.ceiling<p.mastering.peak.ceiling);
  assert.deepEqual(r.after,{integrated:-16,truePeakDb:-.4});
});

test('very quiet mixes use PRESS make-up beyond the 24 dB limiter input',()=>{
  const p=recommendMastering({...quietMix,integratedLufs:-44},{style:'transparent',target:LOUDNESS_TARGETS.streaming});
  assert.equal(p.mastering.peak.drive,24);assert.equal(p.mastering.press.makeup,6);
  assert.ok(p.warnings.some(w=>w.includes('monte d’abord')||w.includes('Monte d’abord')));
  const r=refineMasteringForTarget(p,{integrated:-17,truePeakDb:-2});
  assert.equal(r.mastering.peak.drive,24);assert.equal(r.mastering.press.makeup,9);
});
