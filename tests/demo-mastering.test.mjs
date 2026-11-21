import test from 'node:test';
import assert from 'node:assert/strict';
import {demoMasteringSettings,masterPublicDemo} from '../dist/demo-mastering.js';
import {masteringSettings,exportMasterRack,importMasterRack} from '../dist/mastering.js';
for(const kind of ['trap','afro','rnb','drill','trap808','trap-air','funk','rock','pop','rumba','vox-trap','vox-afro','vox-rnb'])test(kind+' mastering',()=>{
 const p={publicDemo:true,tracks:[{id:'voice',clips:[{id:'clip'}]}],masterVolume:0};
 const tracks=structuredClone(p.tracks);masterPublicDemo(p,kind);
 assert.deepEqual(p.mastering.inserts.filter(Boolean),['balance','press','circuitcolor','peak']);
 for(const id of p.mastering.inserts.filter(Boolean))assert.equal(p.mastering[id].enabled,true);
 assert.equal(p.mastering.peak.ceiling,-1.5);
 assert.deepEqual(p.tracks,tracks);assert.equal(p.masterVolume,0);
 assert.deepEqual(masteringSettings(p.mastering),p.mastering);
 const restored={};importMasterRack(restored,JSON.parse(JSON.stringify(exportMasterRack(p))));assert.deepEqual(restored.mastering,p.mastering);
 p.mastering.peak.drive=0;masterPublicDemo(p,kind);assert.equal(p.mastering.peak.drive,0);
});
test('distinct genres and untouched user projects',()=>{
 assert.notDeepEqual(demoMasteringSettings('trap'),demoMasteringSettings('rnb'));
 const p={mastering:{custom:true}};masterPublicDemo(p,'trap');assert.deepEqual(p,{mastering:{custom:true}});
 assert.equal(demoMasteringSettings('unknown'),null);
});
