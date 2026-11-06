import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 for(const id of ['play','stop','record','bpm','projectName','projectMenuBtn','sessionTrackList','exportWav']) {
  assert.ok(await page.locator('#'+id).count(),id+' must exist');
 }
 await page.locator('#fileMenuBtn').click();
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'true');
 assert.ok(await page.locator('#fileMenuBtn').locator('..').locator('[role="menu"]').isVisible());
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'false');
 assert.ok(await page.locator('#fileMenuBtn').locator('..').locator('[role="menu"]').isHidden());
 await page.locator('#editMenuBtn').click();
 assert.equal(await page.locator('#editMenuBtn').getAttribute('aria-expanded'),'true');
 await page.locator('#fileMenuBtn').click();
 assert.equal(await page.locator('#editMenuBtn').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'true');
 await page.locator('#projectName').click();
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'false');
 await page.locator('#projectMenuBtn').click();
 await page.locator('#projectMenu').waitFor({state:'visible'});
 assert.ok(await page.locator('#saveProject').isVisible(),'project export should be available in menu');
 await page.locator('#projectMenuBtn').click();
 await page.locator('#bpm').fill('120');
 await page.locator('#bpm').press('Tab');
 assert.equal(await page.locator('#bpm').inputValue(),'120');
 await page.locator('[data-view="mixer"]').click();
 await page.locator('#mixerView').waitFor({state:'visible'});
 assert.ok(await page.locator('#mixerView .mixer-channel:not(.mixer-master) [data-add-insert-track]').count()>0,'Each mixer track needs a plugin picker');
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();
 await page.locator('#modal').waitFor({state:'visible'});
 assert.ok(await page.locator('#pluginPickerResults [data-picker-load]').count()>=20,'Master must expose existing effects');
 await page.locator('#pluginSearch').fill('NOTCH');
 await page.locator('[data-picker-load="notch"]').click();
 await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-master-power="notch"]').waitFor({state:'visible'});
 await page.locator('[data-view="mixer"]').click();
 await page.locator('#mixerView .mixer-master [data-insert-open="notch"]').waitFor({state:'visible'});
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();
 assert.ok(await page.locator('[data-picker-load="notch"]').isDisabled(),'Master should block duplicate inserts');
 await page.locator('#closeModal').click();
 await page.locator('#openMastering').click();
 await page.locator('[data-master-power="notch"]').waitFor({state:'visible'});
 assert.ok(await page.locator('#masteringView [data-add-insert-track="master"]').isVisible(),'Mastering needs an add-plugin control');
 assert.deepEqual(errors,[],'studio boot raised JavaScript errors');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 for(const id of ['projectMenuBtn','play','stop','bpm']) {
  const el=mobile.locator('#'+id);
  assert.ok(await el.count(),'missing mobile control '+id);
  const rect=await el.boundingBox();assert.ok(rect&&rect.width>0&&rect.height>0,'hidden mobile control '+id);
 }
 await mobile.close();
 console.log('PASS: Studio desktop transport, project menu, tempo and mobile essentials');
} finally { await browser.close(); }
