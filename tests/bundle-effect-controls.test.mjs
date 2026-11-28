import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,formatParam,ensurePlugins} from '../dist/plugins.js';

// Every thin bundle plugin gained real controls; each default reproduces the
// historical sound (verified bit-identical on a deterministic offline render).
const ADDED={
  phase:{resonance:.7,output:0},ring:{tone:20000,shape:0},orbit:{feedback:0,delay:16},sway:{shape:0,output:0},
  notch:{sweep:1,sweepDepth:0},slap:{lowcut:20},hush:{keyFilter:20},voxshift:{tone:20000,output:0},voxformant:{output:0},
  harditilt:{lowcut:20,highcut:20000},hardistage:{balance:0},harditape:{bump:0},hardidoubler:{detune:0},eliananest:{lowcut:20}
};

test('thin bundle plugins expose their new controls with neutral defaults', ()=>{
  for(const [id,added] of Object.entries(ADDED))for(const [key,value] of Object.entries(added)){
    const control=EFFECTS[id].controls.find(c=>c.key===key);
    assert.ok(control,id+'.'+key+' missing');
    assert.equal(control.default,value,id+'.'+key+' default must keep the historical sound');
    assert.ok(control.min<=value&&value<=control.max,id+'.'+key+' default in range');
  }
});

test('old sessions acquire the new keys without touching saved values', ()=>{
  const track={type:'lead',inserts:['phase','hardistage'],effects:{phase:{enabled:true,rate:.5,frequency:800,depth:.4,mix:.6},hardistage:{enabled:true,width:1.2,mix:1,output:0}}};
  ensurePlugins(track);
  assert.deepEqual(track.effects.phase,{enabled:true,rate:.5,frequency:800,depth:.4,mix:.6,resonance:.7,output:0});
  assert.equal(track.effects.hardistage.width,1.2);assert.equal(track.effects.hardistage.balance,0);
});

test('stepped and balance controls read as words', ()=>{
  const shape=EFFECTS.ring.controls.find(c=>c.key==='shape'),bal=EFFECTS.hardistage.controls.find(c=>c.key==='balance');
  assert.deepEqual([0,1,2].map(v=>formatParam(shape,v)),['Sine','Triangle','Square']);
  assert.equal(formatParam(bal,0),'C');assert.equal(formatParam(bal,-.5),'L 50');assert.equal(formatParam(bal,.25),'R 25');
});
