import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateStereoTransientOffset} from '../dist/recording-stereo-sync.js';
const rate=48000;
function pulse(delay=0){
 const array=new Float32Array(48000);
 for(let k=0;k<350;k++){
  const x=Math.sin(k*.77)*Math.exp(-k/125);
  array[12000+delay+k]=x*.75;
 }
 return array;
}
test('measures known relative transient delays accurately at 48 kHz',()=>{
 for(const samples of [-240,-83,0,67,240]){
  const res=estimateStereoTransientOffset(pulse(),pulse(samples),rate);
  assert.equal(res.ok,true,JSON.stringify(res));
  assert.ok(Math.abs(res.offsetSamples-samples)<=2,JSON.stringify(res));
 }
});
test('rejects silent and uncorrelated stereo channels without inventing a delay',()=>{
 const zero=new Float32Array(48000);
 assert.equal(estimateStereoTransientOffset(zero,zero,rate).ok,false);
 const unrelated=new Float32Array(48000);
 for(let i=12000;i<12500;i++)unrelated[i]=Math.sin(i*.17)*.7;
 const result=estimateStereoTransientOffset(pulse(),unrelated,rate);
 assert.ok(result.ok===false||result.correlation<.8);
});
