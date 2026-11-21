
async function sessionTab(page,tab){const button=page.locator('[data-session-tab="'+tab+'"]');await button.waitFor({state:'visible'});await button.click();}
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
  await sessionTab(page,'create');await page.locator('#libraryNew').waitFor({state:'visible'});
  const result=await page.evaluate(async()=>{
    const {AudioEngine,emptyProject}=await import('/audio.js');
    const {installStudioWorkflow}=await import('/studio-workflow.js');
    const {placeInsert}=await import('/plugins.js');
    const project=emptyProject();project.bars=1;project.name='Export QA';
    const ctx=new OfflineAudioContext(1,144000,48000),source=ctx.createBuffer(1,144000,48000);
    for(let i=0;i<source.length;i++)source.getChannelData(0)[i]=i<24000?.2*Math.sin(i*2*Math.PI*440/48000):0;
    const track=project.tracks[0];track.clips=[{id:'clip',audioId:'source',name:'Test tone',start:0,length:1}];
    placeInsert(track,0,'echo');track.effects.echo.enabled=true;track.effects.echo.mix=.3;track.effects.echo.feedback=.4;
    const assets=new Map([['source',{buffer:source}]]),engine=new AudioEngine(()=>project,()=>assets),messages=[];
    const workflow=installStudioWorkflow({getProject:()=>project,getEngine:()=>engine,getAssets:()=>assets,currentTrack:()=>track,getRecordState:()=>({}),toast:m=>messages.push(m),modal:(title,html)=>{document.getElementById('modalBody').innerHTML=html;}});
    let written=[],closed=false,aborted=false,fail=false,cancel=false;
    globalThis.showSaveFilePicker=async()=>({createWritable:async()=>({
      async write(chunk){
        written.push(new Uint8Array(chunk));
        if(fail&&written.length===2)throw Error('Disque indisponible');
        if(cancel&&written.length===2)document.getElementById('cancelExport').onclick();
      },async close(){closed=true;},async abort(){aborted=true;}
    })});
    const open=()=>{workflow.exportModal();document.getElementById('exportTail').checked=false;};
    open();await document.getElementById('runExport').onclick();
    const link=document.getElementById('downloadRendered'),oldUrl=link.href;
    const downloaded=await (await fetch(oldUrl)).arrayBuffer(),header=new DataView(downloaded);
    const decoder=new AudioContext(),decoded=await decoder.decodeAudioData(downloaded.slice(0));
    const peak=decoded.getChannelData(0).reduce((p,x)=>Math.max(p,Math.abs(x)),0);
    if(peak<.01)throw Error('Exported WAV is silent');
    open();document.getElementById('exportDirect').checked=true;
    await document.getElementById('runExport').onclick();
    const direct=await new Blob(written).arrayBuffer();
    if(!closed||aborted)throw Error('Direct file was not committed');
    if(direct.byteLength!==downloaded.byteLength||new Uint8Array(direct).some((x,i)=>x!==new Uint8Array(downloaded)[i]))throw Error('Direct export changes the DSP output');
    written=[];closed=false;fail=true;open();document.getElementById('exportDirect').checked=true;
    await document.getElementById('runExport').onclick();
    if(!aborted||closed)throw Error('Failed direct export committed a partial file');
    if(document.getElementById('downloadRendered').href!==oldUrl)throw Error('Failed export lost previous download');
    written=[];aborted=false;fail=false;cancel=true;open();document.getElementById('exportDirect').checked=true;
    await document.getElementById('runExport').onclick();
    if(!aborted||closed||written.length!==2)throw Error('Cancellation did not abort the file');
    if(document.getElementById('runExport').disabled)throw Error('Export button was not restored');
    await decoder.close();
    return {frames:decoded.length,sampleRate:header.getUint32(24,true),bits:header.getUint16(34,true),peak,directChunks:Math.ceil(decoded.length/32768)+1,diskFailure:messages.includes('Export impossible : Disque indisponible'),cancelled:messages.includes('Export annulé.')};
  });
  assert.equal(result.bits,24);assert.equal(result.sampleRate,48000);
  assert.ok(result.directChunks>2);assert.equal(result.diskFailure,true);assert.equal(result.cancelled,true);
  console.log('PASS: real WAV/echo render, chunked file, disk failure and cancellation',JSON.stringify(result));
}finally{await browser.close();}
