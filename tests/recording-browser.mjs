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

  assert.deepEqual(errors,[],'Recording Pro must not cause uncaught browser errors');
  console.log('Recording Pro browser QA passed: duo setup, routing persistence, fake mic meter and cleanup.');
}finally{
  await browser.close();
}
