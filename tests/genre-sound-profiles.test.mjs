import test from 'node:test';
import assert from 'node:assert/strict';
import {GENRE_SOUND_PROFILES,validateGenreSoundProfile} from '../dist/genre-sound-profiles.js';
import {createGenreDemoSession} from '../dist/genre-demo-sessions.js';
test('all genre-specific parameters address a real Web Audio instrument or effect',()=>{
 for(const genre of Object.keys(GENRE_SOUND_PROFILES))assert.equal(validateGenreSoundProfile(genre),true);
});
test('Pop and Rumba make audible DSP choices in addition to arrangement',()=>{
 for(const genre of ['pop','rumba']){
  const p=createGenreDemoSession(genre),spec=GENRE_SOUND_PROFILES[genre];
  for(const t of p.tracks.filter(t=>t.type!=='audio'&&t.type!=='wlvox')){
   const instrument=spec.instruments[t.type];
   if(instrument)for(const [name,value] of Object.entries(instrument))assert.equal(t.instrument[name],value,genre+':'+t.type+'.'+name);
   for(const id of t.inserts.filter(Boolean))if(spec.effects[id])
    for(const [name,value] of Object.entries(spec.effects[id]))assert.equal(t.effects[id][name],value,genre+':'+id+'.'+name);
  }
 }
 const pop=createGenreDemoSession('pop'),rumba=createGenreDemoSession('rumba');
 assert.notDeepEqual(pop.tracks.slice(1,6).map(t=>t.type),rumba.tracks.slice(1,6).map(t=>t.type));
 assert.notEqual(pop.tracks.find(t=>t.type==='wlclean').instrument.pickPosition,rumba.tracks.find(t=>t.type==='wlclean').instrument.pickPosition);
});
test('menu order follows recording, composition, mix, mastering, library without duplicate workspaces',async()=>{
 const fs=await import('node:fs');
 const ui=fs.readFileSync(new URL('../dist/signature-ui.js',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../dist/reference-workspace.css',import.meta.url),'utf8');
 assert.ok(ui.includes("record:['Édition'"));
 const row=ui.slice(ui.indexOf('const modes='),ui.indexOf(';if(!modes[mode])'));
 for(const [a,b] of [['record:','compose:'],['compose:','mix:'],['mix:','master:'],['master:','library:']])assert.ok(row.indexOf(a)<row.indexOf(b));
 assert.ok(css.includes('.workspace-toolbar > .view-tabs{display:none!important}'));
});
