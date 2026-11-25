import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionPreview,sessionPreviewPlan} from '../dist/session-preview.js';
import {SESSION_TEMPLATES,createFactorySession} from '../dist/content.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const plan=id=>({id,name:id,section:'REFRAIN A',bars:4,seconds:8,project:{name:id},startBar:8,endBar:12});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('all composition auditions select a bounded four-bar chorus with rhythm and harmony',()=>{
 for(const t of SESSION_TEMPLATES){
  const p=sessionPreviewPlan(t.id),full=createFactorySession(t.id,true);
  assert.equal(p.id,t.id);assert.equal(p.bars,4);assert.match(p.section,/REFRAIN/);
  assert.equal(p.endBar-p.startBar,4);assert.equal(p.seconds,4*240/t.bpm);assert.ok(p.startBar>=0&&p.endBar<=p.project.bars);
  const clips=track=>track.clips.filter(c=>c.start<p.endBar&&c.start+c.length>p.startBar);
  assert.ok(p.project.tracks.some(t=>t.type==='drums'&&clips(t).length));
  assert.ok(p.project.tracks.some(t=>t.type!=='drums'&&clips(t).some(c=>c.notes?.length)));
  p.project.tracks[0].name='changed';assert.equal(full.tracks[0].name,createFactorySession(t.id,true).tracks[0].name);
 }
 assert.throws(()=>sessionPreviewPlan('missing'),/inconnue/);
});
test('stop during rendering aborts and ignores late audio without caching it',async()=>{
 const render=deferred();let signal,played=0;
 const p=new SessionPreview({plan,render:(_,s)=>{signal=s;return render.promise;},play:async()=>{played++;return {stop(){},startedAt:0};}});
 const pending=p.preview('a');assert.equal(p.state.status,'preparing');p.stop();assert.equal(signal.aborted,true);
 render.resolve({duration:8});assert.equal(await pending,false);assert.equal(played,0);assert.equal(p.cache.size,0);assert.equal(p.state.status,'idle');
});
test('replacement owns the audio when an older render completes later',async()=>{
 const a=deferred(),played=[];
 const p=new SessionPreview({plan,render:async p=>p.id==='a'?a.promise:{name:p.id},play:async buffer=>{played.push(buffer.name);return {stop(){},startedAt:0};}});
 const first=p.preview('a');await p.preview('b');a.resolve({name:'a'});assert.equal(await first,false);
 assert.deepEqual(played,['b']);assert.equal(p.state.id,'b');assert.equal(p.state.status,'playing');
});
test('stop during asynchronous playback setup disposes a late player',async()=>{
 const play=deferred();let stopped=0;
 const p=new SessionPreview({plan,render:async()=>({}),play:()=>play.promise});
 const pending=p.preview('a');await tick();p.stop();play.resolve({startedAt:0,stop(){stopped++;}});
 assert.equal(await pending,false);assert.equal(stopped,1);assert.equal(p.state.status,'idle');
});
test('two-entry LRU cache replays, evicts and preserves scoped natural-end state',async()=>{
 const rendered=[],ended=[],stops=[];let now=12;
 const p=new SessionPreview({plan,now:()=>now,render:async p=>{rendered.push(p.id);return {name:p.id};},play:async(b,end)=>{ended.push(end);return {startedAt:12,stop(){stops.push(b.name);}};}});
 await p.preview('a');now=15;assert.equal(p.elapsed,3);await p.preview('b');await p.preview('a');
 assert.deepEqual(rendered,['a','b']);assert.deepEqual(stops,['a','b']);
 ended[0]();assert.equal(p.state.id,'a','old end must not clear the new owner');
 await p.preview('c');assert.deepEqual([...p.cache.keys()],['a','c']);await p.preview('b');assert.deepEqual(rendered,['a','b','c','b']);
 ended.at(-1)();assert.equal(p.state.status,'idle');assert.equal(p.elapsed,0);
});
test('render/play failures are visible and a later audition can recover',async()=>{
 let broken=true;const states=[];
 const p=new SessionPreview({plan,notify:s=>states.push(s.status),render:async()=>{if(broken)throw Error('Source unavailable');return {};},play:async()=>({startedAt:0,stop(){}})});
 assert.equal(await p.preview('a'),false);assert.equal(p.state.status,'error');assert.equal(p.state.message,'Source unavailable');
 broken=false;assert.equal(await p.preview('b'),true);assert.equal(p.state.status,'playing');assert.ok(states.includes('error'));
});
