import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateLoopbackLatency} from '../dist/recording-loopback-analysis.js';
function build({offsets=[240,240,240],missing=-1}={}){
 const rate=48000,signal=new Float32Array(rate*2),pulse=new Float32Array(720);
 for(let i=0;i<pulse.length;i++)pulse[i]=.08*Math.sin(2*Math.PI*997*i/rate)*Math.sin(Math.PI*i/pulse.length)**2;
 [.35,.7,1.05].forEach((second,j)=>{
   if(j===missing)return;
   const at=Math.round(rate*second)+offsets[j];
   for(let i=0;i<pulse.length;i++)signal[at+i]+=pulse[i]*.7;
 });
 return {signal,pulse,rate};
}
test('3-trial wired calibration measures 5 ms with low jitter',()=>{
 const {signal,pulse,rate}=build();
 const result=evaluateLoopbackLatency(signal,pulse,rate);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.latencyMs-5)<.1,JSON.stringify(result));
 assert.ok(result.spreadMs<.1);
 assert.equal(result.attempts.length,3);
});
test('rejects missing pulse and large drift between the three loopback trials',()=>{
 const a=build({missing:1});
 assert.equal(evaluateLoopbackLatency(a.signal,a.pulse,a.rate).ok,false);
 const b=build({offsets:[240,240,720]});
 const result=evaluateLoopbackLatency(b.signal,b.pulse,b.rate);
 assert.equal(result.ok,false,JSON.stringify(result));
 assert.match(result.reason,/instable/);
});
