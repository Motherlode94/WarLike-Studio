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
 await page.locator('#projectMenuBtn').click();
 await page.locator('#projectMenu').waitFor({state:'visible'});
 assert.ok(await page.locator('#saveProject').isVisible(),'project export should be available in menu');
 await page.locator('#projectMenuBtn').click();
 await page.locator('#bpm').fill('120');
 await page.locator('#bpm').press('Tab');
 assert.equal(await page.locator('#bpm').inputValue(),'120');
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
