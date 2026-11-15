import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:8765/_instrument-qa.html');await page.locator('#run').click();await page.waitForFunction(()=>/^(PASS|FAIL)/.test(document.querySelector('#results').textContent),{timeout:120000});const result=await page.locator('#results').textContent();assert.ok(result.startsWith('PASS'),result);console.log('PASS: five dry synth architectures, stereo pad, decay and 12 recorded banks',result);}finally{await browser.close();}
