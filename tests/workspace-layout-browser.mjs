import assert from 'node:assert/strict';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="demos"]').click();await page.locator('#modal [data-factory-project-open="nocturne"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('.reference-window-menu > summary').click();await page.locator('#studioLayoutProfile').selectOption('fl');
 await page.keyboard.press('Escape');await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('F6');
 const rack=page.locator('[data-managed-window="rack"]');await rack.waitFor({state:'visible'});
 const box=await rack.boundingBox();const head=await rack.locator('header strong').boundingBox();
 await page.mouse.move(head.x+30,head.y+10);await page.mouse.down();await page.mouse.move(head.x+30-120,head.y+10-70,{steps:8});await page.mouse.up();
 const moved=await rack.boundingBox();assert.ok(Math.abs(moved.x-box.x)>50);
 await rack.locator('[data-float-resize]').focus();await page.keyboard.press('ArrowLeft');const sized=await rack.boundingBox();assert.ok(sized.width<moved.width);
 await rack.locator('[data-float-close]').click();await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('F6');await rack.waitFor({state:'visible'});
 const reopened=await rack.boundingBox();assert.ok(Math.abs(reopened.x-sized.x)<=2&&Math.abs(reopened.width-sized.width)<=2);
 await page.evaluate(()=>{const menu=document.querySelector('.reference-window-menu');menu.open=true;});
 await page.locator('#workspaceLayoutName').fill('Composition QA');await page.locator('#saveWorkspaceLayout').click();
 assert.equal(await page.locator('#savedWorkspaceLayout').inputValue(),'Composition QA');
 await page.locator('#resetWorkspaceWindows').click();await page.locator('#loadWorkspaceLayout').click();
 await page.keyboard.press('Escape');await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('F6');await rack.waitFor({state:'visible'});const restored=await rack.boundingBox();assert.ok(Math.abs(restored.x-sized.x)<=2&&Math.abs(restored.width-sized.width)<=2);
 await page.reload();await page.locator('[data-session-tab="open"]').click();await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('F6');await rack.waitFor({state:'visible'});const cold=await rack.boundingBox();assert.ok(Math.abs(cold.x-sized.x)<=2&&Math.abs(cold.width-sized.width)<=2);
 // All floating views share a single z-order registry.
 await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('F9');
 const mixer=page.locator('[data-managed-window="mixer"]');await mixer.waitFor({state:'visible'});
 const stack=()=>page.evaluate(()=>({rack:Number(document.querySelector('[data-managed-window=rack]').style.zIndex),mixer:Number(document.querySelector('[data-managed-window=mixer]').style.zIndex)}));
 let order=await stack();assert.ok(order.mixer>order.rack,'newly opened mixer should be above rack');
 await page.evaluate(async()=>{const {focusManagedWindow}=await import('/windows.js');if(!focusManagedWindow('rack'))throw Error('Rack not registered');});
 order=await stack();assert.ok(order.rack>order.mixer,'focusing rack should raise it above mixer');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await mixer.isVisible(),false,'mobile uses the compact mixer rather than the desktop floating window');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('warlike.window.geometry.v1')).fl.rack);
 assert.ok(Math.abs(stored.width-sized.width)<=2,'mobile viewport must not overwrite desktop geometry');
 assert.deepEqual(errors,[]);console.log('PASS: floating rack drag, keyboard resize, reopen, saved workspace restore and cold reload');
}finally{await browser.close();}
