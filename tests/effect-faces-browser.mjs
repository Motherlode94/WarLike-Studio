import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack} from '../dist/content.js';
import {EFFECTS,placeInsert,formatParam} from '../dist/plugins.js';
import {effectFace,effectReadout,effectHardwareIdentity} from '../dist/effect-face-model.js';
import {resizeStudio} from './browser-viewport.mjs';

const dir='artifacts/effect-faces';await mkdir(dir,{recursive:true});
const ids=Object.keys(EFFECTS);
const report=[];
for(const id of ids)assert.ok(EFFECTS[id],id+' missing native processor');
const project=emptyProject();project.name='Individual effect faces QA';
project.tracks=ids.map((id,i)=>{
 const track=createContentTrack('lead');track.id='fxface'+i;track.name='FX '+id;
 placeInsert(track,0,id);return track;
});
const browser=await chromium.launch({headless:true});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('html[data-app-ready="true"]').waitFor({state:'attached'});
 await page.locator('#projectInput').setInputFiles({
  name:'effects.chayah',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:-12,assets:[]}))
 });
 await page.waitForFunction(()=>document.querySelector('#projectName')?.value==='Individual effect faces QA');
 await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();
 for(const [i,id] of ids.entries()){
  const track='fxface'+i,spec=effectFace(id,EFFECTS[id]);
  const strip=page.locator('#mixerView [data-mixer-track="'+track+'"]');
  const open=strip.locator('[data-plugin-open="'+id+'"],[data-insert-open="'+id+'"]').first();
  await open.evaluate(n=>{
   const mixer=document.querySelector('#mixerView'),r=n.getBoundingClientRect(),m=mixer.getBoundingClientRect();
   mixer.scrollLeft+=r.left-m.left-m.width/2;
  });
  await open.click();
  const root=page.locator('.floating-plugin[data-plugin-track="'+track+'"]');
  const face=root.locator('[data-effect-face="'+id+'"]');
  await face.waitFor();
  assert.equal(await face.locator('.effect-face-identity h2').textContent(),EFFECTS[id].name);
  const identity=effectHardwareIdentity(id,EFFECTS[id]);
  assert.equal(await face.getAttribute('data-effect-variant'),identity.variant,id+' missing individual identity');
  assert.equal(await face.getAttribute('data-effect-hardware'),identity.geometry,id+' incorrect hardware housing');
  assert.equal(await face.locator('.effect-hardware-plate strong').textContent(),identity.engraving,id+' wrong engraving');
  assert.match(await face.locator('.effect-hardware-plate').getAttribute('aria-label'),/Identité du processeur/);
  assert.equal(await face.locator('[data-hardware-mark]').count(),4,id+' no individual hardware marks');
  const plate=await face.locator('.effect-hardware-plate').evaluate(node=>({
    width:node.getBoundingClientRect().width,
    surface:node.closest('[data-effect-face]').getBoundingClientRect().width
  }));
  assert(plate.width>0&&plate.width<=plate.surface+2,id+' hardware plate overflowing window');
  assert.equal(await root.locator('.plugin-rack-drawer,.track-rack-catalog').count(),0,id+' embeds a forbidden rack');
  assert.equal(await root.locator('.plugin-command-surface > [data-effect-face="'+id+'"]').count(),1,id+' must own exactly one standalone editor');
  assert.equal(await root.locator('[data-instrument-face]').count(),0,id+' mixes instrument and effect surfaces');
  const bounds=await root.evaluate(node=>{
   const shell=node.getBoundingClientRect(),face=node.querySelector('[data-effect-face]').getBoundingClientRect();
   return {shellLeft:shell.left,shellRight:shell.right,faceLeft:face.left,faceRight:face.right,faceWidth:face.width};
  });
  assert(bounds.faceWidth>0&&bounds.faceLeft>=bounds.shellLeft-2&&bounds.faceRight<=bounds.shellRight+2,id+' editor leaves its own window');
  const keys=await root.locator('[data-param^="'+id+'."]').evaluateAll(nodes=>nodes.map(n=>n.dataset.param.split('.').at(-1)));
  assert.deepEqual(keys.sort(),EFFECTS[id].controls.map(c=>c.key).sort(),id+' missing or duplicated controls');
  assert.equal(await root.locator('.plugin-command-bar').count(),1);
  assert.equal(await root.locator('.effect-face-heading svg').count(),1);
  assert.equal(await face.locator('[data-effect-readout]').count(),spec.focus.length);
  const key=spec.focus[0],c=EFFECTS[id].controls.find(x=>x.key===key),input=root.locator('[data-param="'+id+'.'+key+'"]');
  const before=Number(await input.inputValue());
  const next=before+c.step<=c.max?Number((before+c.step).toFixed(7)):Number((before-c.step).toFixed(7));
  await input.evaluate((node,value)=>{node.value=String(value);node.dispatchEvent(new Event('input',{bubbles:true}));},next);
  const target=effectReadout(c,next,formatParam);
  await page.waitForFunction(({track,key,target})=>
   document.querySelector('.floating-plugin[data-plugin-track="'+track+'"] [data-effect-readout="'+key+'"]')?.textContent===target,
   {track,key,target});
  assert.equal(await root.locator('[data-plugin-history="undo"]').isEnabled(),true,id+' undo unavailable');
  await root.locator('[data-plugin-history="undo"]').click();
  assert.equal(Number(await root.locator('[data-param="'+id+'.'+key+'"]').inputValue()),before,id+' undo must restore local value');
  report.push({id,controls:keys.length,edited:key});
  if(['prism','glue','exospace','vectoreq'].includes(id)){
   await page.screenshot({path:dir+'/'+id+'-desktop.png'});
  }
  await root.locator('[data-float-close]').click();
 }
 await resizeStudio(page,{width:390,height:844});
 // Verify an independent effect panel fits mobile width and retains its native inputs.
 const prismTrack='fxface'+ids.indexOf('prism');
 const button=page.locator('#mixerView [data-mixer-track="'+prismTrack+'"] [data-plugin-open="prism"],#mixerView [data-mixer-track="'+prismTrack+'"] [data-insert-open="prism"]').first();
 await button.click();
 const mobile=page.locator('.floating-plugin[data-plugin-track="'+prismTrack+'"]');
 await mobile.locator('[data-effect-face="prism"]').waitFor();
 await page.waitForFunction(track=>{
  const face=document.querySelector('.floating-plugin[data-plugin-track="'+track+'"] [data-effect-face="prism"]');
  if(!face)return false;
  const r=face.getBoundingClientRect();return r.width>0&&r.width<=innerWidth;
 },prismTrack);
 const geometry=await mobile.locator('[data-effect-face="prism"]').evaluate(face=>({
  scroll:face.scrollWidth,client:face.clientWidth,rect:face.getBoundingClientRect().toJSON()
 }));
 assert.ok(geometry.scroll<=geometry.client+2,'mobile hardware overflow');
 assert.equal(await mobile.locator('.plugin-rack-drawer,.track-rack-catalog').count(),0,'mobile effect shows a forbidden rack');
 await page.screenshot({path:dir+'/prism-mobile.png'});
 assert.deepEqual(errors,[],'browser script exceptions');
 await writeFile(dir+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('PASS: '+ids.length+' standalone effect editors with no rack nodes, bounded desktop layout, control integrity, live readouts, scoped undo and mobile spot-check');
}finally{await browser.close();}
