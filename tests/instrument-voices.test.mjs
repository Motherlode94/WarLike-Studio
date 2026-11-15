import test from 'node:test';
import assert from 'node:assert/strict';
import {pluckedString,voiceSettings} from '../dist/instrument-voices.js';
import {ACOUSTIC_PRESETS,ACOUSTIC_INSTRUMENTS,sampleSettings} from '../dist/acoustic.js';
test('physical string stays tuned across sample rates and decays without DC',()=>{
 for(const sr of [44100,48000,96000])for(const hz of [110,261.6256,880]){
  const data=pluckedString(sr,hz,.8,5000);let peak=0,sum=0,early=0,late=0;
  for(let i=0;i<data.length;i++){assert.ok(Number.isFinite(data[i]));peak=Math.max(peak,Math.abs(data[i]));sum+=data[i];if(i<sr*.1)early+=data[i]**2;if(i>sr*.7&&i<sr*.8)late+=data[i]**2;}
  assert.ok(peak>0&&peak<1.8);assert.ok(Math.abs(sum/data.length)<.01);assert.ok(late<early*.05);
  // Autocorrelation in the expected period neighborhood, after the noisy attack.
  const expected=sr/hz;let best=0,score=-Infinity;
  for(let lag=Math.floor(expected*.94);lag<=Math.ceil(expected*1.06);lag++){let n=0;for(let i=Math.floor(sr*.02);i<sr*.12;i++)n+=data[i]*data[i+lag];if(n>score){score=n;best=lag;}}
  assert.ok(Math.abs(1200*Math.log2(sr/best/hz))<45,`string detuned at ${sr}/${hz}: lag ${best}`);
 }
});
test('all acoustic presets are authored for their own bank and preserve valid settings',()=>{
 const signatures=new Set();for(const [type,presets] of Object.entries(ACOUSTIC_PRESETS)){
  assert.equal(presets.length,4);for(const p of presets){assert.deepEqual(sampleSettings(type,p.values),{...sampleSettings(type),...p.values});if(Object.keys(p.values).length)signatures.add(JSON.stringify(p.values));}
  assert.equal(new Set(presets.map(p=>p.name)).size,4);assert.ok(ACOUSTIC_INSTRUMENTS[type]);
 }assert.equal(signatures.size,36);
});
test('synth settings sanitize imported values and keep deliberate zero detune',()=>{assert.equal(voiceSettings('keys',{detune:0}).detune,0);assert.equal(voiceSettings('pad',{attack:NaN}).attack,.45);assert.equal(voiceSettings('lead',{cutoff:Infinity,release:999}).release,1.2);});
