import test from 'node:test';
import assert from 'node:assert/strict';
import {seriesTakes,createRecordingSeries} from '../dist/recording-series.js';
import {recordingSettings} from '../dist/recording.js';
import {recordingWindow} from '../dist/recording-range.js';
test('old recording ranges remain single takes and series sizes are explicit',()=>{
 const range={enabled:true,start:4,end:5};assert.deepEqual(recordingSettings({range}).range,range);
 for(const takes of [1,2,4]){assert.equal(seriesTakes(String(takes)),takes);const settings=recordingSettings({range:{...range,takes}});assert.equal(settings.range.takes||1,takes);assert.equal(recordingWindow(settings.range,{bars:16,bpm:120}).seconds,2);}
 for(const value of [0,3,8,1.5,NaN,Infinity,'invalid'])assert.throws(()=>seriesTakes(value),/Série invalide/);
 assert.equal(recordingWindow({...range,enabled:false,takes:4},{bars:16,bpm:120}),null);
});
test('a saved complete automatic take advances once, and the finite quota ends the series',()=>{
 for(const total of [2,4]){const s=createRecordingSeries(total);for(let i=1;i<=total;i++){assert.equal(s.state.current,i);assert.equal(s.advance({persisted:true,complete:true,automatic:true}),i<total);}assert.deepEqual(s.state,{current:total,total,saved:total,active:false});assert.equal(s.advance({persisted:true,complete:true,automatic:true}),false);assert.equal(s.state.saved,total);}
});
test('failed saves, incomplete capture and manual stops cannot restart capture',()=>{
 for(const options of [{persisted:false,complete:true,automatic:true},{persisted:true,complete:false,automatic:true},{persisted:true,complete:true,automatic:false}]){const s=createRecordingSeries(4);assert.equal(s.advance(options),false);assert.equal(s.state.active,false);assert.equal(s.state.current,1);assert.equal(s.advance({persisted:true,complete:true,automatic:true}),false);}
});
test('Stop during an awaited save wins over its later successful resolution',async()=>{
 const s=createRecordingSeries(2);let commit;const saving=new Promise(resolve=>{commit=resolve;}).then(()=>s.advance({persisted:true,complete:true,automatic:true}));s.cancel();s.cancel();commit();assert.equal(await saving,false);assert.equal(s.state.current,1);assert.equal(s.state.active,false);
});

import {rangePlacement} from '../dist/recording-range.js';
test('punch placement clips both ends without modifying the original capture',()=>{
 const original={start:1,length:4,sourceOffset:.25};
 assert.deepEqual(rangePlacement(original,{start:2,end:4},120),{start:2,length:2,sourceOffset:2.25});
 assert.deepEqual(original,{start:1,length:4,sourceOffset:.25});
 assert.deepEqual(rangePlacement({start:0,length:1,sourceOffset:0},{start:4,end:5},120),{start:4,length:0,sourceOffset:2});
 assert.deepEqual(rangePlacement({start:6,length:1,sourceOffset:0},{start:4,end:5},120),{start:5,length:0,sourceOffset:0});
 assert.throws(()=>rangePlacement({...original,sourceOffset:NaN},{start:2,end:4},120),/invalide/);
});
