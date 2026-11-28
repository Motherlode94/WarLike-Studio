import test from 'node:test';
import assert from 'node:assert/strict';
import {stagePublicDemoMix,PUBLIC_DEMO_STAGING_DB,PUBLIC_DEMO_STAGED_DRIVE} from '../dist/demo-gain-staging.js';

const demo=()=>({publicDemo:true,masterVolume:0,mastering:{inserts:['balance','press','circuitcolor','peak'],press:{threshold:-18},peak:{drive:24}},tracks:[
 {id:'a',volume:-15,output:'drums',sends:[]},
 {id:'drums',volume:0,output:'master',sends:[{id:'s',target:'verb',level:-12,pre:false}]},
 {id:'b',volume:-14,output:'master',sends:[{id:'p',target:'verb',level:-10,pre:true}]},
 {id:'verb',volume:-3,output:'master',sends:[]}]});

test('gain lands on master-feeding tracks, sends and master stay balanced',()=>{
 const p=stagePublicDemoMix(demo(),'pop'),g=PUBLIC_DEMO_STAGING_DB.pop;
 assert.equal(p.tracks[0].volume,-15,'tracks routed to a bus are untouched');
 assert.equal(p.tracks[1].volume,12,'bus fader capped at +12 dB');
 assert.equal(p.tracks[1].sends[0].level,-24,'post-fader send compensated');
 assert.equal(p.tracks[2].sends[0].level,-10,'pre-fader send unaffected');
 assert.equal(p.masterVolume,g-12,'remainder on the pre-master fader');
 assert.equal(p.mastering.press.threshold,Math.round((-18-g)*10)/10);assert.equal(p.mastering.peak.drive,PUBLIC_DEMO_STAGED_DRIVE.pop);
});

test('staging is idempotent and ignores user projects and other demos',()=>{
 const p=stagePublicDemoMix(demo(),'funk'),snap=JSON.stringify(p);
 assert.equal(JSON.stringify(stagePublicDemoMix(p,'funk')),snap);
 const user={...demo(),publicDemo:false};assert.equal(JSON.stringify(stagePublicDemoMix(structuredClone(user),'funk')),JSON.stringify(user));
 const other=demo();assert.equal(JSON.stringify(stagePublicDemoMix(structuredClone(other),'trap808')),JSON.stringify(other));
});
