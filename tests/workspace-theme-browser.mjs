import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert} from '../dist/plugins.js';

// Test the rendered cascade, including styles loaded after the shell adapter.
const folder='artifacts/workspace-themes';await mkdir(folder,{recursive:true});
const themes=['forest','graphite','slate','light'];
const sizes=[{width:1920,height:1080},{width:1366,height:768},{width:390,height:844}];
const browser=await chromium.launch({headless:true});let page,current='boot';
const errors=[],report=[];
try{
 page=await browser.newPage({viewport:sizes[0]});page.setDefaultTimeout(10000);
 page.on('pageerror',e=>errors.push(e.message));
 const project=emptyProject();project.name='R08.3g.7 theme matrix';
 const track=createContentTrack('harp');track.id='themeharp';track.name='Harpe — thèmes';placeInsert(track,0,'glue');project.tracks=[track];
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready="true"]').waitFor({state:'attached'});
 await page.locator('#projectInput').setInputFiles({name:'themes.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:-12,assets:[]}))});
 await page.waitForFunction(()=>document.querySelector('#toast').textContent==='Projet importé et sauvegardé.');await page.locator('#modal').waitFor({state:'hidden'});
 const save=async()=>{
  await page.locator('#projectMenuBtn').click();const waiting=page.waitForEvent('download');await page.locator('#saveProject').click();
  return JSON.parse(await readFile(await(await waiting).path(),'utf8'));
 };
 const baseline=await save();
 const contrast=async selector=>{
  // Measure the final solid surface rather than a transient hover/theme paint.
  await page.waitForFunction(selector=>{let n=document.querySelector(selector);if(!n)return false;for(;n;n=n.parentElement)if(getComputedStyle(n).backgroundImage!=='none')return false;return true;},selector);
  return page.locator(selector).first().evaluate(n=>{
  const rgba=s=>{const p=s.match(/[\d.]+/g)?.map(Number)??[];return [p[0]??0,p[1]??0,p[2]??0,p[3]??1];};
  const over=(a,b)=>{const alpha=a[3]??1;return a.slice(0,3).map((x,i)=>x*alpha+b[i]*(1-alpha));};
  const parents=[];for(let p=n;p;p=p.parentElement)parents.push(p);
  let bg=[255,255,255];for(const p of parents.reverse()){
   const s=getComputedStyle(p);
   bg=over(rgba(s.backgroundColor),bg);
  }
  const luma=c=>c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const a=luma(over(rgba(getComputedStyle(n).color),bg)),b=luma(bg);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 });};
 const fits=async root=>{
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const geometry=await page.locator(root).first().evaluate(n=>{
   const r=n.getBoundingClientRect();return {width:r.width,left:r.left,right:r.right,viewport:innerWidth,scroll:n.scrollWidth,client:n.clientWidth};
  });
  assert.ok(geometry.width>0,current+' missing '+root);
  assert.ok(geometry.left>=-1&&geometry.right<=geometry.viewport+1,current+' horizontal panel bounds '+root+': '+JSON.stringify(geometry));
  assert.ok(geometry.scroll<=geometry.client+2,current+' horizontal panel overflow '+root+': '+JSON.stringify(geometry));
 };
 const instrument='.floating-plugin[data-plugin-track="themeharp"]:has([data-instrument-face])';
 const effect='.floating-plugin[data-plugin-track="themeharp"]:has([data-effect-face])';
 for(const layout of ['pt','fl'])for(const size of sizes)for(const theme of themes){
  current=layout+'/'+size.width+'/'+theme;await page.setViewportSize(sizes[0]);
  await page.locator('.reference-window-menu > summary').click();await page.locator('#studioLayoutProfile').selectOption(layout);await page.locator('.reference-window-menu > summary').click();
  await page.locator('[data-view="library"]').click();await page.locator('[data-bank-tab="sounds"]').click();
  await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await page.setViewportSize(size);
  await fits('.content-browser');
  const ratios={};
  for(const selector of ['.bank-heading .eyebrow','.bank-heading h2','.bank-heading p','.content-card h3','.content-card p','.content-card-type','.bank-tabs button.selected']){
   ratios[selector]=await contrast(selector);
   assert.ok(ratios[selector]>=4.5,current+' unreadable '+selector+': '+ratios[selector]);
  }
  await page.locator('#bankSearch').focus();
  assert.ok(await page.locator('.bank-search').evaluate(n=>{const s=getComputedStyle(n);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2;}),current+' missing keyboard focus ring');
  if(size.width>760){assert.ok(await contrast('.brand>span:not(.brandmark):not(.version)')>=4.5,current+' brand contrast');}
  await page.screenshot({path:folder+'/'+layout+'-'+size.width+'-'+theme+'-library.png'});
  await page.setViewportSize(sizes[0]);await page.locator('[data-view="mixer"]').click();
  const strip=page.locator('#mixerView [data-mixer-track="themeharp"]');
  await strip.locator('[data-plugin-open="instrument"]').click({force:true});
  const before=await page.locator(instrument+' [data-param="instrument.brightness"]').inputValue();
  await page.locator('.top-actions [data-studio-theme]').selectOption(themes[(themes.indexOf(theme)+1)%themes.length]);
  await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await page.setViewportSize(size);await fits(instrument);
  assert.equal(await page.locator(instrument+' [data-param="instrument.brightness"]').inputValue(),before);
  await page.locator(instrument+' .plugin-preset-browser > summary').click();
  await page.locator(instrument+' .plugin-preset-browser').getByRole('searchbox').fill('concert');
  assert.ok(await page.locator(instrument+' [data-preset-source="factory"]').count()>0,current+' inaccessible factory preset search');
  await fits(instrument+' .plugin-preset-browser');
  await page.keyboard.press('Escape');assert.equal(await page.locator(instrument+' .plugin-preset-browser').getAttribute('open'),null);
  await page.locator(instrument+' [data-float-close]').click();
  await page.setViewportSize(sizes[0]);await page.locator('[data-view="mixer"]').click();await strip.locator('[data-plugin-open="glue"],[data-insert-open="glue"]').first().click({force:true});
  await page.setViewportSize(size);await fits(effect);await page.screenshot({path:folder+'/'+layout+'-'+size.width+'-'+theme+'-plugin.png'});
  await page.locator(effect+' [data-float-close]').click();
  const duplicates=await page.locator('[id]').evaluateAll(nodes=>{const ids=nodes.map(n=>n.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});
  assert.deepEqual(duplicates,[],current+' duplicate DOM IDs');report.push({layout,...size,theme,contrast:ratios});
 }
 current='persistence';await page.setViewportSize(sizes[0]);const after=await save();
 assert.deepEqual(after.project,baseline.project,'appearance changes must preserve the normalized project');assert.deepEqual(after.assets,baseline.assets);
 await page.reload();await page.locator('[data-session-tab="open"]').click();await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('html').getAttribute('data-warlike-theme'),'light');assert.equal(await page.locator('body').getAttribute('data-layout-profile'),'fl');
 assert.deepEqual((await save()).project,baseline.project,'cold reopen preserves the project');assert.deepEqual(errors,[]);
 console.log('PASS: 24 theme/layout/viewport cases, rendered contrast, focus, plugin reflow/preset search, project and appearance persistence');
}catch(error){await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});console.error('Theme matrix failed at',current,errors);throw error;}
finally{await writeFile(folder+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
