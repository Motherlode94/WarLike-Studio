import test from 'node:test';
import assert from 'node:assert/strict';
import {createVocalDemoSession} from '../dist/vocal-demo-sessions.js';
import {routePublicDemoGroups} from '../dist/demo-group-buses.js';
import {routeVocalSubgroups} from '../dist/demo-vocal-buses.js';
import {routeVocalFX} from '../dist/demo-vocal-fx.js';
import {normaliseRouting} from '../dist/studio-model.js';
import {effectType} from '../dist/plugins.js';
for(const kind of ['vox-trap','vox-afro','vox-rnb'])test(kind+' wet returns',()=>{
const p=createVocalDemoSession(kind);p.publicDemo=true;
const voices=p.tracks.filter(t=>t.type==='audio');
for(const t of voices)t.clips=[{id:'clip'}];
routePublicDemoGroups(p);routeVocalSubgroups(p);
const dry=voices.map(t=>t.inserts.filter(id=>id&&!['alterecho','exospace'].includes(effectType(id))));
routeVocalFX(p);
const returns=p.tracks.filter(t=>t.id.startsWith('demofx'));
assert.equal(returns.length,3);
for(const t of returns){assert.equal(t.output,'demobusvocals');assert.equal(t.effects[t.inserts.find(Boolean)].mix,1);}
for(const t of p.tracks.filter(t=>t.id.startsWith('demovox'))){assert.equal(t.sends.length,3);assert.ok(t.sends.every(s=>!s.pre&&s.enabled&&returns.some(r=>r.id===s.target)));}
assert.deepEqual(voices.map(t=>t.inserts.filter(Boolean)),dry);
const copy=JSON.parse(JSON.stringify(p));normaliseRouting(copy);
for(const t of copy.tracks.filter(t=>t.id.startsWith('demovox')))assert.equal(t.sends.length,3);
const snapshot=structuredClone(p);routeVocalFX(p);assert.deepEqual(p,snapshot);
});
