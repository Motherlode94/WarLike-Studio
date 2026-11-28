import test from 'node:test';import assert from 'node:assert/strict';
import {setDemoPlaybackLevel,FACTORY_DEMO_DRIVE,PUBLIC_DEMO_DRIVE} from '../dist/demo-playback-level.js';
import {createFactorySession,SESSION_TEMPLATES} from '../dist/content.js';
import {BEAT_DEMOS} from '../dist/beat-demo-sessions.js';
import {NEW_GENRE_DEMOS} from '../dist/genre-demo-sessions.js';
import {VOCAL_DEMOS} from '../dist/vocal-demo-sessions.js';
test('every catalog song has a measured, editable demo gain',()=>{
 assert.deepEqual(Object.keys(FACTORY_DEMO_DRIVE).sort(),SESSION_TEMPLATES.map(t=>t.id).sort());
 assert.deepEqual(Object.keys(PUBLIC_DEMO_DRIVE).sort(),[...Object.keys(BEAT_DEMOS),...Object.keys(NEW_GENRE_DEMOS),'trap','afro','rnb',...Object.keys(VOCAL_DEMOS)].sort());
 for(const {id} of SESSION_TEMPLATES){const p=createFactorySession(id,true);assert.equal(p.masterVolume,0);assert.equal(p.mastering.peak.drive,FACTORY_DEMO_DRIVE[id]);assert.equal(p.mastering.peak.ceiling,-1.5);}
});
test('demo level pass leaves custom projects and already edited copies intact',()=>{
 const p={masterVolume:-14,mastering:{inserts:['peak'],peak:{enabled:true,drive:0,ceiling:-2}}},saved=structuredClone(p);
 setDemoPlaybackLevel(p,'nocturne');assert.deepEqual(p,saved);
 const demo={...structuredClone(p),publicDemo:true};setDemoPlaybackLevel(demo,'trap','public');assert.equal(demo.masterVolume,0);assert.equal(demo.mastering.peak.ceiling,-2);
 demo.masterVolume=-7;demo.mastering.peak.drive=1;const edited=structuredClone(demo);setDemoPlaybackLevel(demo,'trap','public');assert.deepEqual(demo,edited);
 const unknown={...structuredClone(p),publicDemo:true};setDemoPlaybackLevel(unknown,'unknown','public');assert.equal(unknown.masterVolume,-14);
});
