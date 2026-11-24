import test from 'node:test';
import assert from 'node:assert/strict';
import {takeSelection,takeAuditionProject,createTakeAudition} from '../dist/take-audition.js';
import {AudioEngine,emptyProject} from '../dist/audio.js';
function project(){const p=emptyProject();p.bpm=120;p.tracks[0].id='vox';p.tracks[0].clips=[{id:'original',start:0,length:8,audioId:'old'}];p.tracks[0].playlists=[{id:'a',clips:[{id:'take',audioId:'a',start:1,length:5,sourceOffset:.2}]}];p.tracks.push({...structuredClone(p.tracks[0]),id:'backing',clips:[{id:'music',audioId:'music',start:0,length:12}],playlists:[]});return p;}
test('audition crops source offsets and context without changing any project or playlist',()=>{
 const p=project(),before=structuredClone(p),out=takeAuditionProject(p,'vox','a',{start:2,end:4});assert.deepEqual(p,before);assert.equal(out.bars,4);assert.equal(out.tracks[0].clips[0].audioId,'a');assert.equal(out.tracks[0].clips[0].sourceOffset,2.2);assert.equal(out.tracks[0].clips[0].length,2);assert.equal(out.tracks[1].clips[0].sourceOffset,4);assert.equal(out.tracks[1].clips[0].length,2);
 for(const range of [{start:-1,end:2},{start:2,end:2},{start:0,end:17},{start:NaN,end:4}])assert.throws(()=>takeAuditionProject(p,'vox','a',range),/valide/);assert.throws(()=>takeAuditionProject(p,'vox','missing',{start:2,end:4}),/introuvable/);assert.throws(()=>takeAuditionProject(p,'vox','a',{start:8,end:9}),/ne contient pas/);
});
test('drag selection stays nonempty at the final edge and preserves pattern phase',()=>{
 assert.deepEqual(takeSelection(16,16,16),{start:15.9375,end:16});assert.deepEqual(takeSelection(4,2,16),{start:2,end:4});assert.throws(()=>takeSelection(NaN,4,16),/invalide/);
 const p=project();p.tracks.push({id:'notes',type:'synth',clips:[{start:1,length:6,patternOffset:3,notes:[]}]});const out=takeAuditionProject(p,'vox','a',{start:2,end:4});assert.equal(out.tracks[2].clips[0].patternOffset,19);
});
test('audition loop bounds are independent of project loops and a one-shot waits for its true end',()=>{
 const p=project(),e=new AudioEngine(()=>p,()=>new Map());p.loopRange={start:8,end:12};e.takePreview={project:takeAuditionProject(p,'vox','a',{start:2,end:4}),range:{start:2,end:4}};assert.deepEqual(e.playbackLoopBounds(),{start:32,end:64});
 e.ctx={currentTime:10};e.loop=false;e.playing=true;e.startTime=10.1-64*e.stepDuration;e.scheduledStep=64;let ended=0;e.onEnded=()=>ended++;e.scheduler();assert.equal(e.playing,true);e.ctx.currentTime=10.11;e.scheduler();assert.equal(ended,1);assert.equal(e.playing,false);
});
function harness(){const p=project(),e=new AudioEngine(()=>p,()=>new Map());e.position=96;e.loop=true;e.patternMode='pattern';e.clipPreview={id:'clip'};let tick,clears=0;e.pause=function(){this.playing=false;};e.play=async function(){this.playing=true;};const a=createTakeAudition({engine:e,project:p,trackId:'vox',setTimer:fn=>{tick=fn;return 1;},clearTimer:()=>clears++});return {p,e,a,tick:()=>tick(),get clears(){return clears;}};}
test('stopping or ending restores the cursor and transport modes without resuming normal playback',async()=>{
 const h=harness();await h.a.listen('a',{start:2,end:4},{loop:false});assert.equal(h.e.position,32);assert.equal(h.e.patternMode,null);assert.ok(h.e.takePreview.project);h.e.playing=false;h.tick();assert.equal(h.e.position,96);assert.equal(h.e.loop,true);assert.equal(h.e.patternMode,'pattern');assert.deepEqual(h.e.clipPreview,{id:'clip'});assert.equal(h.e.takePreview,undefined);h.a.dispose();
});
test('closing while prepare is pending cannot restart playback or overwrite a later audition',async()=>{
 const h=harness();let release;h.e.play=()=>new Promise(resolve=>{release=resolve;});const pending=h.a.listen('a',{start:2,end:4});h.a.stop();h.e.takePreview={external:true};release();await pending;assert.deepEqual(h.e.takePreview,{external:true});assert.equal(h.e.position,96);h.a.dispose();
});
test('before and after restart the same context while keeping one preview and the original transport',async()=>{
 const h=harness(),before=structuredClone(h.p),range={start:1.75,end:3.25},current=h.p.tracks[0].clips,proposed=[{id:'new',audioId:'a',start:2,length:1,gainDb:-6,fadeIn:.02,fadeOut:.02}];
 await h.a.listen(null,range,{clips:current,comparison:'before',loop:true});assert.equal(h.e.takePreview.comparison,'before');assert.equal(h.e.takePreview.project.tracks[0].clips[0].audioId,'old');assert.equal(h.e.loop,true);assert.equal(h.e.position,28);
 await h.a.listen(null,range,{clips:proposed,comparison:'after'});assert.equal(h.e.takePreview.comparison,'after');assert.equal(h.e.takePreview.project.tracks[0].clips[0].audioId,'a');assert.equal(h.e.takePreview.project.tracks[0].clips[0].gainDb,-6);assert.equal(h.e.loop,false);assert.equal(h.e.position,28);
 await h.a.listen(null,range,{clips:current,comparison:'before'});assert.equal(h.e.takePreview.project.tracks[0].clips[0].audioId,'old');h.a.stop();assert.equal(h.e.position,96);assert.equal(h.e.loop,true);assert.equal(h.e.patternMode,'pattern');assert.deepEqual(h.e.clipPreview,{id:'clip'});assert.equal(h.e.takePreview,undefined);assert.deepEqual(h.p,before);h.a.dispose();
});
test('comparison states distinguish before, after and idle',async()=>{
 const h=harness(),events=[],a=createTakeAudition({engine:h.e,project:h.p,trackId:'vox',onChange:state=>events.push(state),setTimer:()=>1,clearTimer:()=>{}});
 await a.listen(null,{start:2,end:3},{clips:h.p.tracks[0].clips,comparison:'before'});assert.deepEqual(events.slice(-2).map(s=>[s.status,s.comparison]),[['preparing','before'],['playing','before']]);a.stop();assert.deepEqual(events.at(-1),{status:'idle'});a.dispose();h.a.dispose();
});
