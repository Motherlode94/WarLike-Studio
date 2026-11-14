import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Browser-level coverage of the actual Recording Pro interface. Simulated mic
// is not a substitute for validating a real two-input audio interface.
const browser=await chromium.launch({headless:true,args:[
  '--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'
]});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
  await page.locator('#libraryName').waitFor({state:'visible'});
  await page.locator('#libraryName').fill('Recording Duo QA');
  await page.locator('#libraryNew').click();
  await page.locator('#modal').waitFor({state:'hidden'});

  await page.locator('#recordWorkspaceToggle').click();
  assert.equal(await page.locator('#recordWorkspaceBar').isVisible(),true,'recording toolbar is visible');
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('record-workspace')),true);

  await page.locator('#recordWorkspaceDuo').click();
  const arms=page.locator('#trackRows [data-record-arm][aria-pressed="true"]');
  assert.equal(await arms.count(),2,'duo must arm exactly two real audio tracks');
  const inputs=await page.locator('#trackRows [data-record-input]').evaluateAll(els=>els
    .filter(el=>el.closest('.track-row')?.querySelector('[data-record-arm][aria-pressed="true"]'))
    .map(el=>el.value));
  assert.deepEqual(inputs,['1','2'],'duo assigns separate hardware inputs');
  assert.equal(await page.locator('#recordWorkspaceStart').isEnabled(),true);
  assert.match(await page.locator('#recordWorkspaceTarget').innerText(),/Armées/);

  // Check route/arm persistence using the real IndexedDB project save.
  await page.locator('#saveStatus').getByText('Enregistré sur cet appareil').waitFor({state:'visible'});
  await page.reload({waitUntil:'load'});
  await page.locator('[data-project-open]').first().click();
  await page.locator('#modal').waitFor({state:'hidden'});
  assert.equal(await page.locator('#trackRows [data-record-arm][aria-pressed="true"]').count(),2);
  assert.deepEqual(await page.locator('#trackRows [data-record-input]').evaluateAll(els=>els.filter(el=>el.closest('.track-row')?.querySelector('[data-record-arm][aria-pressed="true"]')).map(el=>el.value)),inputs);

  // Monitor-mix preferences must persist, but default remains off.
  await page.locator('#recordWorkspaceMic').click();
  await page.locator('#inputMonitorLevel').waitFor({state:'visible'});
  assert.equal(await page.locator('#inputMonitor').isChecked(),false);
  await page.locator('#inputMonitorLevel').fill('-24');
  await page.locator('#inputMonitorLevel2').fill('-30');
  await page.locator('#saveAudioSetup').click();
  await page.locator('#modal').waitFor({state:'hidden'});
  await page.locator('#saveStatus').getByText('Enregistré sur cet appareil').waitFor({state:'visible'});
  await page.reload({waitUntil:'load'});
  await page.locator('[data-project-open]').first().click();
  await page.locator('#modal').waitFor({state:'hidden'});
  await page.locator('#recordWorkspaceMic').click();
  await page.locator('#inputMonitorLevel').waitFor({state:'visible'});
  assert.equal(await page.locator('#inputMonitorLevel').inputValue(),'-24');
  assert.equal(await page.locator('#inputMonitorLevel2').inputValue(),'-30');
  await page.locator('#closeModal').click();

  // A fake WebRTC mic is enough to validate permissions, meter lifecycle and
  // UI error-handling, NOT physical stereo sync, latency or channel isolation.
  await page.locator('#recordWorkspaceMicTest').click();
  await page.locator('#recordWorkspaceMicTest[aria-pressed="true"]').waitFor({state:'visible',timeout:10000});
  assert.match(await page.locator('#recordWorkspaceInputDb').innerText(),/dBFS/);
  assert.match(await page.locator('#recordWorkspaceInput2Db').innerText(),/IN 2/);
  await page.locator('#recordWorkspaceMicTest').click();
  assert.equal(await page.locator('#recordWorkspaceMicTest').getAttribute('aria-pressed'),'false');
  // Fake capture may expose mono or stereo. Either way, the guided diagnostic
  // must respond without a JS crash or claiming physical verification.
  await page.locator('#recordWorkspaceMicDiagnostic').click();
  await page.locator('#recordWorkspaceMicDiagnosticResult').waitFor({state:'visible'});
  assert.ok((await page.locator('#recordWorkspaceMicDiagnosticResult').innerText()).length>10);
  if(await page.locator('#recordWorkspaceMicDiagnostic').innerText()==='Étape suivante'){
    await page.locator('#recordWorkspaceMicDiagnostic').click();
    await page.locator('#recordWorkspaceMicDiagnostic').click();
    assert.match(await page.locator('#recordWorkspaceMicDiagnosticResult').innerText(),/non confirmée|Signal insuffisant|Séparation des entrées/);
  }

  // A user must be able to switch back to a one-mic vocal session.
  await page.locator('#recordWorkspaceSolo').click();
  assert.equal(await page.locator('#trackRows [data-record-arm][aria-pressed="true"]').count(),1);
  assert.equal(await page.locator('#trackRows [data-record-arm][aria-pressed="true"]').locator('..').locator('[data-record-input]').inputValue(),'1');
  assert.equal(await page.locator('#recordWorkspaceStart').isEnabled(),true);
  await page.locator('#recordWorkspaceDuo').click();
  assert.equal(await page.locator('#trackRows [data-record-arm][aria-pressed="true"]').count(),2);

  await page.locator('#recordWorkspaceToggle').click();
  assert.equal(await page.locator('#recordWorkspaceBar').isHidden(),true);

  // Deliberately overwhelm a journal in-browser: it should report a bounded
  // storage backlog and still flush previously accepted PCM for recovery.
  const overrun=await page.evaluate(async()=>{
    const {beginRecordingJournal}=await import('./recording-recovery.js');
    let warning='';
    const journal=await beginRecordingJournal({sampleRate:48000,channels:1,projectName:'Backpressure QA',onError:e=>warning=e.message});
    const accepted=journal.append([Float32Array.from([.25,.5])]);
    const rejected=journal.append([new Float32Array(48000*13)]);
    const saturated=journal.saturated;
    await journal.flush();
    const recovered=await journal.toAudioBuffer({
      createBuffer:(channels,length)=>{const samples=Array.from({length:channels},()=>new Float32Array(length));return {length,numberOfChannels:channels,getChannelData:c=>samples[c]};}
    });
    const frames=recovered.length;
    await journal.clear();
    return {accepted,rejected,saturated,frames,warning};
  });
  assert.equal(overrun.accepted,true);
  assert.equal(overrun.rejected,false);
  assert.equal(overrun.saturated,true);
  assert.equal(overrun.frames,2);
  assert.match(overrun.warning,/Stockage trop lent/);

  // Crash recovery must survive a reload and export real WAV bytes from IndexedDB.
  await page.evaluate(async()=>{
    const {beginRecordingJournal}=await import('./recording-recovery.js');
    const journal=await beginRecordingJournal({sampleRate:48000,channels:2,projectName:'Recovery QA'});
    journal.append([Float32Array.from([.1,.2,.3]),Float32Array.from([.4,.5,.6])]);
    await journal.flush();
    const ctx={sampleRate:48000,createBuffer:(channels,length,sampleRate)=>{
      const data=Array.from({length:channels},()=>new Float32Array(length));
      return {numberOfChannels:channels,length,sampleRate,getChannelData:i=>data[i]};
    }};
    const buffered=await journal.toAudioBuffer(ctx);
    if(buffered.length!==3||Math.abs(buffered.getChannelData(1)[2]-.6)>1e-6)
      throw Error('Journal PCM reconstitution failed');
    journal.close();
  });
  await page.reload({waitUntil:'load'});
  await page.locator('[data-project-open]').first().click();
  await page.locator('#modal').waitFor({state:'hidden'});
  // Verify the disk-writer streaming path against the real IndexedDB journal.
  const verified=await page.evaluate(async()=>{
    const {listRecoverableRecordings}=await import('./recording-recovery.js');
    const {exportRecoveryWav}=await import('./recording-wav-stream.js');
    const items=await listRecoverableRecordings();
    const chunks=[];
    const result=await exportRecoveryWav(items.find(x=>x.projectName==='Recovery QA').id,{
      writer:{async write(chunk){chunks.push(chunk);}}
    });
    const bytes=new Uint8Array(result.bytes);let offset=0;
    for(const chunk of chunks){bytes.set(new Uint8Array(chunk),offset);offset+=chunk.byteLength;}
    const view=new DataView(bytes.buffer);
    return {length:bytes.length,channels:view.getUint16(22,true),
      floatCode:view.getUint16(20,true),samples:view.getUint32(40,true),
      sample:view.getFloat32(44+4,true)};
  });
  assert.equal(verified.length,68);
  assert.equal(verified.channels,2);
  assert.equal(verified.floatCode,3);
  assert.equal(verified.samples,24);
  assert.ok(Math.abs(verified.sample-.4)<.00001);
  // Browser download fallback must remain available in CI headless mode.
  await page.evaluate(()=>{Object.defineProperty(window,'showSaveFilePicker',{value:undefined,configurable:true});});
  await page.locator('#recordWorkspaceToggle').click();
  await page.locator('#recordWorkspaceRecover').click();
  await page.getByText('Recovery QA', {exact:false}).waitFor({state:'visible'});
  const exported=page.waitForEvent('download');
  await page.locator('.recording-recovery-dialog').getByRole('button',{name:'Exporter en WAV'}).click();
  const wavDownload=await exported;
  assert.match(wavDownload.suggestedFilename(),/\.wav$/);
  page.once('dialog',modal=>modal.accept());
  await page.locator('.recording-recovery-dialog').getByRole('button',{name:'Supprimer la sauvegarde'}).click();
  await page.locator('.recording-recovery-dialog').getByRole('button',{name:'Fermer'}).click();

  // Nonmodal QA panel: can keep Recording toolbar available and export an honest report.
  await page.locator('#recordWorkspaceValidate').click();
  assert.equal(await page.locator('.recording-validation-dialog').getAttribute('open'),'');
  await page.locator('#validationTarget').selectOption('60');
  await page.evaluate(()=>{
    window.dispatchEvent(new CustomEvent('warlike:recording-sync-measurement',{detail:{offsetMs:2.5,correlation:.91,sampleRate:48000,kind:'acoustic-arrival'}}));
    window.dispatchEvent(new CustomEvent('warlike:recording-loopback-measurement',{detail:{latencyMs:11.2,spreadMs:.25,kind:'wired-round-trip'}}));
  });
  assert.match(await page.locator('#validationHardwareEvidence').innerText(),/Sync IN 1\/2 : 2.50 ms/);
  assert.match(await page.locator('#validationHardwareEvidence').innerText(),/Bouclage câblé : 11.20 ms/);
  assert.match(await page.locator('#validationHardwareEvidence').innerText(),/Latence casque à sens unique : non mesurée/);

  await page.evaluate(()=>{
    const emit=(type,frames)=>window.dispatchEvent(new CustomEvent('warlike:recording-telemetry',{
      detail:{type,takeId:'qa-take',frames,sampleRate:48000,channels:2,at:Date.now()}
    }));
    emit('start',0);
    emit('progress',48000);
  });
  assert.match(await page.locator('#validationPcmEvidence').innerText(),/PCM reçu : 1.0 s/);
  assert.match(await page.locator('#validationPcmEvidence').innerText(),/PCM sauvegardé : 0.0 s/);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('warlike:recording-telemetry',{
    detail:{type:'finalized',takeId:'qa-take',frames:96000,sampleRate:48000,at:Date.now()}
  })));
  assert.match(await page.locator('#validationPcmEvidence').innerText(),/PCM sauvegardé : 2.0 s/);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('warlike:recording-telemetry',{
    detail:{type:'progress',takeId:'quality-qa',frames:48000,sampleRate:48000,channels:2,
      signal:{channelStats:[{channel:1,peakDbfs:-3.5,clippedFrames:0,longestSilenceSeconds:.2},
                            {channel:2,peakDbfs:-6,clippedFrames:12,longestSilenceSeconds:.6}]}}
  })));
  assert.match(await page.locator('#validationSignalQuality').innerText(),/IN 2 : pic -6.0 dBFS/);
  assert.match(await page.locator('#validationSignalQuality').innerText(),/saturation 12 échant/);


  await page.locator('[data-validation-check="mic1"]').check();
  assert.equal(await page.locator('#recordWorkspaceStart').count(),1);
  const reportEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'Terminer et télécharger le rapport'}).click();
  const validationDownload=await reportEvent;
  assert.ok(validationDownload.suggestedFilename().startsWith('WarLike-Recording-validation-') && validationDownload.suggestedFilename().endsWith('.json'));
  assert.equal(await page.locator('.recording-validation-dialog').evaluate(el=>el.open),false);

  assert.deepEqual(errors,[],'Recording Pro must not cause uncaught browser errors');
  console.log('Recording Pro browser QA passed: duo setup, routing persistence, fake mic meter and cleanup.');
}finally{
  await browser.close();
}
