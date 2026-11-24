import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareComp,compContext,commitComp,canContinueComp,compFadeMs,compGainOffsetDb,auditCompSeams} from '../dist/comp-preview.js';
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
test('fade durations accept zero and fractional milliseconds within a finite range',()=>{
 assert.equal(compFadeMs(),8);for(const value of [0,.5,8,15.5,50])assert.equal(compFadeMs(value),value);for(const value of [-1,50.1,NaN,Infinity,null])assert.throws(()=>compFadeMs(value),/0 et 50/);
 const p=project(),t=p.tracks[0],prepared=prepareComp(p,'vox','A',{start:4,end:5},uid),before=structuredClone(t);prepared.fadeMs=99;assert.throws(()=>commitComp(t,prepared,uid),/0 et 50/);assert.deepEqual(t,before);
});
test('only inserted clips and their touching neighbours receive the requested duration',()=>{
 const p=project(),t=p.tracks[0];t.clips[0].fadeIn=.003;t.clips[0].fadeOut=.004;t.playlists[0].clips[0].fadeCurve='equalPower';t.playlists[0].clips[0].gainDb=3;t.clips.push({id:'far',audioId:'far',start:10,length:1,fadeIn:.03,fadeOut:.04});const before=structuredClone(p),plan=prepareComp(p,'vox','A',{start:4,end:5},uid,{fadeMs:20});
 const [left,insert,right,far]=plan.clips;assert.equal(left.fadeIn,.003);assert.equal(left.fadeOut,.02);assert.equal(insert.fadeIn,.02);assert.equal(insert.fadeOut,.02);assert.equal(insert.fadeCurve,'equalPower');assert.equal(insert.gainDb,3);assert.equal(right.fadeIn,.02);assert.equal(right.fadeOut,.004);assert.deepEqual(far,t.clips[1]);assert.deepEqual(p,before);
});
test('zero explicitly disables new seam fades without changing the audio references',()=>{
 const p=project(),plan=prepareComp(p,'vox','A',{start:4,end:5},uid,{fadeMs:0});assert.equal(plan.clips[0].fadeOut,0);assert.equal(plan.clips[1].fadeIn,0);assert.equal(plan.clips[1].fadeOut,0);assert.equal(plan.clips[2].fadeIn,0);assert.deepEqual(plan.clips.map(c=>c.audioId),['sourceB','sourceA','sourceB']);
});
test('short clips cap each new fade at half their musical duration',()=>{
 const plan=prepareComp(project(),'vox','A',{start:4,end:4.001},uid,{fadeMs:50}),c=plan.pieces[0];assert.ok(Math.abs(c.fadeIn-.001)<1e-10);assert.ok(Math.abs(c.fadeOut-.001)<1e-10);
});
test('continuing a montage stores its duration while earlier edits retain theirs',()=>{
 const p=project(),t=p.tracks[0];commitComp(t,prepareComp(p,'vox','A',{start:4,end:5},uid,{fadeMs:20}),uid);const first=structuredClone(t.clips.find(c=>c.audioId==='sourceA'));commitComp(t,prepareComp(p,'vox','A',{start:6,end:7},uid,{mode:'append',fadeMs:30}),uid);assert.equal(t.playlists.find(l=>l.id===t.activePlaylist).comp.fadeMs,30);assert.deepEqual(t.clips.find(c=>c.id===first.id),first);assert.equal(t.clips.find(c=>c.start===6).fadeIn,.03);assert.equal(t.clips.find(c=>c.start===6).fadeOut,.03);
});

test('excerpt gain accepts finite offsets and rejects invalid requests before mutation',()=>{
 assert.equal(compGainOffsetDb(),0);for(const value of [-24,-6,.5,0,24])assert.equal(compGainOffsetDb(value),value);
 const p=project(),before=structuredClone(p);for(const value of [-24.1,24.1,NaN,Infinity,null,'3']){assert.throws(()=>compGainOffsetDb(value),/ajustement/);assert.throws(()=>prepareComp(p,'vox','A',{start:4,end:5},uid,{gainOffsetDb:value}),/ajustement/);}assert.deepEqual(p,before);
 const plan=prepareComp(p,'vox','A',{start:4,end:5},uid);plan.gainOffsetDb=Infinity;assert.throws(()=>commitComp(p.tracks[0],plan,uid),/ajustement/);assert.deepEqual(p,before);
});
test('gain adjustment adds to each inserted source gain and leaves neighbours and files intact',()=>{
 const p=project(),t=p.tracks[0];t.clips[0].gainDb=2;t.playlists[1].clips[0].gainDb=2;t.playlists[0].clips=[{id:'one',audioId:'sourceA',start:1,length:3.5,sourceOffset:.2,gainDb:3,fadeCurve:'equalPower'},{id:'two',audioId:'sourceA2',start:4.5,length:3.5,sourceOffset:2,gainDb:-2}];const before=structuredClone(p),plan=prepareComp(p,'vox','A',{start:4,end:5},uid,{gainOffsetDb:-6});
 assert.deepEqual(plan.pieces.map(c=>[c.audioId,c.gainDb,c.sourceOffset]),[['sourceA',-3,6.2],['sourceA2',-8,2]]);assert.equal(plan.pieces[0].fadeCurve,'equalPower');assert.deepEqual(plan.clips.filter(c=>c.audioId==='sourceB').map(c=>c.gainDb),[2,2]);assert.deepEqual(p,before);
 const snapshot=takeAuditionProject(p,'vox',null,compContext(plan.range,p.bars),plan.clips);assert.deepEqual(snapshot.tracks[0].clips.filter(c=>c.audioId!=='sourceB').map(c=>c.gainDb),[-3,-8]);commitComp(t,plan,uid);assert.deepEqual(t.playlists.slice(0,2),before.tracks[0].playlists);assert.deepEqual(t.clips,plan.clips);
});
test('zero gain adjustment preserves existing and unspecified source gains',()=>{
 for(const gain of [undefined,0,-24,36]){const p=project(),c=p.tracks[0].playlists[0].clips[0];if(gain!==undefined)c.gainDb=gain;const plan=prepareComp(p,'vox','A',{start:4,end:5},uid);assert.equal(plan.pieces[0].gainDb,gain);assert.equal(Object.hasOwn(plan.pieces[0],'gainDb'),gain!==undefined);}
});
test('out of range final gains are refused rather than silently clipped',()=>{
 for(const [gain,offset] of [[35,2],[-23,-2],[NaN,1],[Infinity,0]]){const p=project();p.tracks[0].playlists[0].clips[0].gainDb=gain;const before=structuredClone(p);assert.throws(()=>prepareComp(p,'vox','A',{start:4,end:5},uid,{gainOffsetDb:offset}),/gain final/);assert.deepEqual(p,before);}
 for(const [gain,offset] of [[35,1],[-23,-1]]){const p=project();p.tracks[0].playlists[0].clips[0].gainDb=gain;assert.equal(prepareComp(p,'vox','A',{start:4,end:5},uid,{gainOffsetDb:offset}).pieces[0].gainDb,gain+offset);}
});
test('continuing with another gain preserves earlier excerpts and does not accumulate on raw takes',()=>{
 const p=project(),t=p.tracks[0];commitComp(t,prepareComp(p,'vox','A',{start:4,end:5},uid,{gainOffsetDb:-6}),uid);const first=structuredClone(t.clips.find(c=>c.start===4));commitComp(t,prepareComp(p,'vox','A',{start:6,end:7},uid,{mode:'append',gainOffsetDb:3}),uid);assert.deepEqual(t.clips.find(c=>c.id===first.id),first);assert.equal(t.clips.find(c=>c.start===6).gainDb,3);assert.equal(t.playlists.find(l=>l.id==='A').clips[0].gainDb,undefined);
 commitComp(t,prepareComp(p,'vox','A',{start:2,end:3},uid,{mode:'append'}),uid);assert.equal(t.clips.find(c=>c.start===2).gainDb,undefined);assert.equal(t.clips.find(c=>c.start===4).gainDb,-6);
});
test('before and after contexts refuse invalid bounds instead of clamping them into a different edit',()=>{
 for(const [range,bars] of [[{start:-1,end:2},16],[{start:1,end:17},16],[{start:2,end:2},16],[{start:NaN,end:2},16],[{start:1,end:2},Infinity]])assert.throws(()=>compContext(range,bars),/plage de montage valide/);
});

test('R08.16 checks both junctions without modifying the proposed or saved montage',()=>{
 const p=project(),before=structuredClone(p),plan=prepareComp(p,'vox','A',{start:4,end:5},uid);
 const snapshot=structuredClone(plan),report=auditCompSeams(p,plan);
 assert.deepEqual(report.seams.map(s=>s.bar),[4,5]);
 assert.equal(report.clean,true);
 assert.deepEqual(report.warnings,[]);
 assert.deepEqual(p,before);
 assert.deepEqual(plan,snapshot);
});
test('R08.16 warns on dangerous gain jump and absent safety fade, without rewriting any take',()=>{
 const p=project();p.tracks[0].playlists[0].clips[0].gainDb=12;
 const plan=prepareComp(p,'vox','A',{start:4,end:5},uid,{fadeMs:0});
 const before=structuredClone(p),candidate=structuredClone(plan);
 const report=auditCompSeams(p,plan);
 assert.equal(report.clean,false);
 assert.equal(report.seams.length,2);
 for(const seam of report.seams){
  assert(seam.warnings.some(w=>w.includes('6 dB')));
  assert(seam.warnings.some(w=>w.includes('3 ms')));
 }
 assert.deepEqual(p,before);
 assert.deepEqual(plan,candidate);
});
test('R08.16 validates range and flags an excerpt without audio at a boundary',()=>{
 const p=project(),plan=prepareComp(p,'vox','A',{start:4,end:5},uid);
 plan.clips=plan.clips.filter(c=>c.audioId!=='sourceA');
 assert.equal(auditCompSeams(p,plan).clean,false);
 assert(auditCompSeams(p,plan).warnings.some(w=>w.includes('sans audio')));
 assert.throws(()=>auditCompSeams(p,{...plan,range:{start:5,end:5}}),/plage de montage valide/);
});
