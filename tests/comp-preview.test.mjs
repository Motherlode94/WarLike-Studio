import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareComp,compContext,commitComp,canContinueComp} from '../dist/comp-preview.js';
import {takeAuditionProject} from '../dist/take-audition.js';
let next=0;const uid=()=>String(++next);
function project(){const a={id:'a',audioId:'sourceA',start:1,length:7,sourceOffset:.2},b={id:'b',audioId:'sourceB',start:1,length:7,sourceOffset:.5};return {bars:16,bpm:120,tracks:[{id:'vox',type:'audio',clips:[structuredClone(b)],activePlaylist:'B',playlists:[{id:'A',name:'A',clips:[a]},{id:'B',name:'B',clips:[structuredClone(b)]}]}]};}
test('preparing a comp leaves the active arrangement and all playlists intact',()=>{
 const p=project(),before=structuredClone(p),plan=prepareComp(p,'vox','A',{start:4,end:5},uid);assert.deepEqual(p,before);assert.deepEqual(plan.clips.map(c=>[c.start,c.length,c.audioId,c.sourceOffset]),[[1,3,'sourceB',.5],[4,1,'sourceA',6.2],[5,3,'sourceB',8.5]]);assert.equal(plan.pieces[0].fadeIn,.008);assert.equal(plan.pieces[0].fadeOut,.008);
 const snapshot=takeAuditionProject(p,'vox',null,compContext(plan.range,p.bars),plan.clips);assert.equal(snapshot.bars,5.25);assert.deepEqual(snapshot.tracks[0].clips.map(c=>c.audioId),['sourceB','sourceA','sourceB']);assert.deepEqual(p,before);
});
test('commit creates an independent montage playlist and retains both original takes',()=>{
 const p=project(),track=p.tracks[0],before=structuredClone(track.playlists),plan=prepareComp(p,'vox','A',{start:4,end:5},uid),playlist=commitComp(track,plan,uid);assert.equal(track.playlists.length,3);assert.equal(track.activePlaylist,playlist.id);assert.equal(playlist.name,'Montage 3');assert.deepEqual(track.playlists.slice(0,2),before);assert.deepEqual(track.clips,plan.clips);assert.notEqual(track.clips,plan.clips);assert.deepEqual(playlist.clips,track.clips);
});
test('invalid or empty comp requests fail without creating playlists or changing clips',()=>{
 const p=project(),before=structuredClone(p);for(const range of [{start:NaN,end:5},{start:4,end:4},{start:0,end:17},{start:-1,end:1}])assert.throws(()=>prepareComp(p,'vox','A',range,uid),/valide/);assert.throws(()=>prepareComp(p,'vox','B',{start:4,end:5},uid),/autre prise/);assert.throws(()=>prepareComp(p,'vox','A',{start:10,end:11},uid),/vide/);assert.deepEqual(p,before);
});
test('a stale prepared comp cannot overwrite a newer arrangement',()=>{
 const p=project(),track=p.tracks[0],plan=prepareComp(p,'vox','A',{start:4,end:5},uid);track.clips[0].gainDb=3;const changed=structuredClone(track);assert.throws(()=>commitComp(track,plan,uid),/a changé/);assert.deepEqual(track,changed);
});
test('audition context is one beat on either side and stays within the song',()=>{
 assert.deepEqual(compContext({start:4,end:5},16),{start:3.75,end:5.25});assert.deepEqual(compContext({start:0,end:16},16),{start:0,end:16});
});
test('new montages respect the playlist count accepted by project import',()=>{
 const p=project();while(p.tracks[0].playlists.length<64)p.tracks[0].playlists.push({id:uid(),clips:[]});const before=structuredClone(p);assert.throws(()=>prepareComp(p,'vox','A',{start:4,end:5},uid),/64 playlists/);assert.deepEqual(p,before);
});
test('several excerpts continue one montage with the original sources intact',()=>{
 const p=project(),t=p.tracks[0],originals=structuredClone(t.playlists);commitComp(t,prepareComp(p,'vox','A',{start:4,end:5},uid),uid);const id=t.activePlaylist;t.playlists.find(l=>l.id===id).name='Choix voix';assert.equal(canContinueComp(t),true);
 const before=structuredClone(t),plan=prepareComp(p,'vox','A',{start:6,end:7},uid,{mode:'append'});assert.deepEqual(t,before);commitComp(t,plan,uid);assert.equal(t.activePlaylist,id);assert.equal(t.playlists.length,3);assert.equal(t.playlists.find(l=>l.id===id).name,'Choix voix');assert.deepEqual(t.playlists.slice(0,2),originals);assert.deepEqual(t.clips.map(c=>[c.start,c.length,c.audioId,c.sourceOffset]),[[1,3,'sourceB',.5],[4,1,'sourceA',6.2],[5,1,'sourceB',8.5],[6,1,'sourceA',10.2],[7,1,'sourceB',12.5]]);
});
test('raw or legacy playlists cannot be overwritten as a continued montage',()=>{
 const p=project(),t=p.tracks[0];t.playlists.find(l=>l.id===t.activePlaylist).name='Montage 1';assert.equal(canContinueComp(t),false);const before=structuredClone(t);assert.throws(()=>prepareComp(p,'vox','A',{start:4,end:5},uid,{mode:'append'}),/Crée d’abord/);assert.deepEqual(t,before);assert.throws(()=>prepareComp(p,'vox','A',{start:4,end:5},uid,{mode:'invalid'}),/destination/);
});
test('continuation works at 64 playlists while an explicit new copy is blocked',()=>{
 const p=project(),t=p.tracks[0];commitComp(t,prepareComp(p,'vox','A',{start:4,end:5},uid),uid);while(t.playlists.length<64)t.playlists.push({id:uid(),clips:[]});const current=t.activePlaylist;commitComp(t,prepareComp(p,'vox','A',{start:6,end:7},uid,{mode:'append'}),uid);assert.equal(t.playlists.length,64);assert.equal(t.activePlaylist,current);assert.throws(()=>prepareComp(p,'vox','A',{start:6,end:7},uid,{mode:'new'}),/64 playlists/);
});
test('explicit new copies stay independent of the montage being continued',()=>{
 const p=project(),t=p.tracks[0];commitComp(t,prepareComp(p,'vox','A',{start:4,end:5},uid),uid);const current=t.activePlaylist,old=structuredClone(t.clips);commitComp(t,prepareComp(p,'vox','A',{start:6,end:7},uid,{mode:'new'}),uid);assert.notEqual(t.activePlaylist,current);assert.equal(t.playlists.length,4);assert.deepEqual(t.playlists.find(l=>l.id===current).clips,old);assert.equal(canContinueComp(t),true);
});
test('a continuation cannot exceed the clip count accepted on reopening',()=>{
 const p=project(),t=p.tracks[0];commitComp(t,prepareComp(p,'vox','A',{start:4,end:5},uid),uid);t.clips=Array.from({length:512},(_,i)=>({id:uid(),audioId:'sourceB',start:i/32,length:1/32}));t.playlists.find(l=>l.id==='A').clips=[{id:'wide',audioId:'sourceA',start:0,length:16}];const before=structuredClone(t);assert.throws(()=>prepareComp(p,'vox','A',{start:.01,end:.02},uid,{mode:'append'}),/512 clips/);assert.deepEqual(t,before);
});
