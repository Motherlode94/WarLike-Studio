import assert from 'node:assert/strict';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage(); await page.goto('http://127.0.0.1:8765/_factory-audio-qa.html');
 const result=await page.evaluate(async()=>{
  const {renderScheduled}=await import('/offline-schedule.js');
  async function render(batchSteps){
   const ctx=new OfflineAudioContext(2,44100*9,44100),delay=ctx.createDelay(1),wet=ctx.createGain();
   delay.delayTime.value=.19;wet.gain.value=.25;delay.connect(wet);wet.connect(ctx.destination);
   const schedule=i=>{const t=.01+i*.04;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=220+110*(i%3);g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(0,t+.13);o.connect(g);g.connect(ctx.destination);g.connect(delay);o.start(t);o.stop(t+.14);};
   return renderScheduled(ctx,{start:0,end:192,stepSeconds:.04,schedule,batchSteps});
  }
  const full=await render(256),windowed=await render(32);let max=0,rms=0;
  for(let ch=0;ch<2;ch++){const a=full.getChannelData(ch),b=windowed.getChannelData(ch);for(let i=0;i<a.length;i++){const d=a[i]-b[i];max=Math.max(max,Math.abs(d));rms+=d*d;}}
  return {max,rms:Math.sqrt(rms/(full.length*2)),frames:windowed.length};
 });
 assert.equal(result.frames,44100*9);assert.ok(result.max<.0001,JSON.stringify(result));assert.ok(result.rms<.000001,JSON.stringify(result));console.log('PASS: contiguous offline schedule preserves oscillator tails and delay across windows',result);
}finally{await browser.close();}
