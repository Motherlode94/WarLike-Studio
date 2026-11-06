import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 const result=await page.evaluate(async()=>{
  const {createPackProcessors,syncPackProcessors}=await import('/pack-audio.js');
  const {pluginDefaults}=await import('/plugins.js');
  async function tone(id,frequency,enabled=true){
   const sr=44100,ctx=new OfflineAudioContext(1,sr,sr);
   const src=ctx.createOscillator();src.type='sine';src.frequency.value=frequency;
   const rack=createPackProcessors(ctx,ctx.createGain(),ctx.createGain(),{detached:true,types:[id]});
   const m=rack.modules[id];src.connect(m.input);m.output.connect(ctx.destination);
   const effects=pluginDefaults('audio').effects;
   effects[id].enabled=enabled;
   if(id==='tilteq'){effects[id].tilt=9;effects[id].pivot=1000;effects[id].mix=1;}
   if(id==='notch'){effects[id].frequency=1200;effects[id].q=6;effects[id].mix=1;}
   syncPackProcessors(rack,effects,120,0,true);
   src.start(0);src.stop(.95);
   const audio=await ctx.startRendering();
   rack.dispose();
   const data=audio.getChannelData(0);
   let sum=0,count=0;
   for(let i=sr*.2|0;i<sr*.8;i++){sum+=data[i]**2;count++;}
   return Math.sqrt(sum/count);
  }
  async function slap(){
   const sr=44100,ctx=new OfflineAudioContext(1,sr,.4*sr);
   const src=ctx.createBufferSource(),buf=ctx.createBuffer(1,ctx.length,sr);
   buf.getChannelData(0)[0]=1;src.buffer=buf;
   const rack=createPackProcessors(ctx,ctx.createGain(),ctx.createGain(),{detached:true,types:['slap']});
   src.connect(rack.modules.slap.input);rack.modules.slap.output.connect(ctx.destination);
   const e=pluginDefaults('audio').effects;e.slap.enabled=true;e.slap.time=95;e.slap.feedback=0;e.slap.tone=12000;e.slap.mix=.6;
   syncPackProcessors(rack,e,120,0,true);src.start(0);
   const audio=await ctx.startRendering(),data=audio.getChannelData(0);
   // Filtered delay transients need a broader window than a single sample.
   const tail=data.subarray(Math.floor(sr*.07),Math.floor(sr*.2));
   let echo=0;for(const sample of tail)echo=Math.max(echo,Math.abs(sample));
   rack.dispose();return {early:data[0],echo};
  }
  return {
   notchDry:await tone('notch',1200,false),notchWet:await tone('notch',1200,true),
   tiltLowDry:await tone('tilteq',150,false),tiltLowWet:await tone('tilteq',150,true),
   tiltHighDry:await tone('tilteq',6000,false),tiltHighWet:await tone('tilteq',6000,true),
   slap:await slap()
  };
 });
 assert.ok(result.notchWet<result.notchDry*.55,'Notch has no audible attenuation: '+JSON.stringify(result));
 assert.ok(result.tiltLowWet<result.tiltLowDry*.85,'Tilt EQ does not lower low frequencies');
 assert.ok(result.tiltHighWet>result.tiltHighDry*1.3,'Tilt EQ does not boost upper frequencies');
 assert.ok(result.slap.echo>.1,'Slap Delay produced no audible echo: '+JSON.stringify(result));
 console.log('PASS: offline Web Audio frequency filtering, spectral tilt, and slap delay',result);
}finally{await browser.close()}
