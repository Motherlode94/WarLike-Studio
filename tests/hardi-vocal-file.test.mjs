import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HARDI_VOCAL_EFFECTS,HARDI_VOCAL_PRESETS} from '../dist/hardi-vocal.js';
import {EFFECTS,ensurePlugins} from '../dist/plugins.js';
import {FACTORY_PRESETS,applyFactoryPreset} from '../dist/bundle.js';
import {createPackProcessors,syncPackProcessors} from '../dist/pack-audio.js';
import {editHardiAudio} from '../dist/hardi-file-operations.js';
import {encodeWav} from '../dist/wav.js';
const ids=Object.keys(HARDI_VOCAL_EFFECTS);
test('HARDI vocal FX are real rack modules with three presets each',()=>{
 assert.deepEqual(ids,['hardivoice','hardivocalcomp','hardideess','hardidoubler']);
 for(const id of ids){assert(EFFECTS[id],id);assert.equal(HARDI_VOCAL_PRESETS[id].length,3);assert.equal(FACTORY_PRESETS[id].length,3);
  const t={type:'audio',clips:[]};ensurePlugins(t);applyFactoryPreset(t,id,1);assert(t.inserts.includes(id));assert(t.effects[id].enabled);
  for(const c of EFFECTS[id].controls)assert(t.effects[id][c.key]>=c.min&&t.effects[id][c.key]<=c.max,id+' '+c.key);
 }
});
test('file operations preserve source and produce bounded WAV audio',()=>{
 const raw=[new Float32Array([.4,.8,.1,-.5,0,.2]),new Float32Array([-.2,-.1,.2,.7,-.3,.1])];
 const input={sampleRate:6,length:6,duration:1,numberOfChannels:2,getChannelData:i=>raw[i]};
 const copy=raw.map(x=>x.slice());
 const result=editHardiAudio(input,{start:0,end:1,reverse:true,invert:true,removeDC:true,normalizeDb:-3,fadeIn:.1,fadeOut:.1,rate:1});
 assert.equal(result.numberOfChannels,2);assert.equal(result.length,6);
 for(const data of result.channels){assert(data.every(x=>Number.isFinite(x)&&Math.abs(x)<=1));assert(Math.abs(data[0])<1e-8);assert(Math.abs(data.at(-1))<1e-8);}
 assert.deepEqual(raw,copy);
 const wav=encodeWav(result,{bits:24});assert.equal(new DataView(wav).getUint16(34,true),24);
 assert.throws(()=>editHardiAudio(input,{start:.8,end:.2}),/Plage/);
 assert.throws(()=>editHardiAudio(input,{rate:3}),/Vitesse/);
});
test('file editor is exposed from Studio Project menu',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../dist/hardi-file-tools.html',import.meta.url),'utf8');
 assert.match(html,/hardi-file-tools\.html/);assert.match(editor,/editHardiAudio/);assert.match(editor,/encodeWav/);
});
