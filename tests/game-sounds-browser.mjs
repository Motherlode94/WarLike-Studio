import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack} from '../dist/content.js';
import {gameSoundWav} from '../dist/game-sounds.js';
const folder='artifacts/game-sounds';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true});let page;const errors=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
 const project=emptyProject(),track=createContentTrack('wltitan');track.id='gamefixture';track.clips=[{id:'keepnotes',name:'MIDI conservé',start:0,length:1,patternSteps:16,notes:[{id:'keepnote',midi:48,step:0,len:4,velocity:.7}]}];project.tracks=[track];project.name='Game sounds QA';
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready="true"]').waitFor({state:'attached'});
 const upload=async data=>{await page.locator('#projectInput').setInputFiles({name:'game.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await page.waitForFunction(()=>document.querySelector('#toast').textContent==='Projet importé et sauvegardé.');await page.locator('#modal').waitFor({state:'hidden'});};
 await upload({format:'chayah-studio',project,masterVolume:-12,assets:[]});
 const open=async()=>{await page.locator('#projectMenuBtn').click();await page.locator('#gameSoundBank').click();await page.locator('[data-game-sound]').first().waitFor();};
 const save=async()=>{await page.locator('#projectMenuBtn').click();const wait=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await wait).path(),'utf8'));};
 const before=await save();
 await open();assert.equal(await page.locator('[data-game-sound]').count(),12);assert.equal(await page.locator('#bankResults').textContent(),'24 / 24 sons de jeu');
 await page.locator('[data-game-page="next"]').click();assert.match(await page.locator('.instru-bank-pager').textContent(),/Page 2/);
 await page.locator('#bankSearch').fill('laser');assert.equal(await page.locator('[data-game-sound]').count(),2);
 const wavWait=page.waitForEvent('download');await page.locator('[data-game-wav="laser-shot"]').click();
 const wav=await readFile(await(await wavWait).path());assert.deepEqual(wav,Buffer.from(gameSoundWav('laser-shot')));await writeFile(folder+'/laser-shot.wav',wav);
 await page.locator('#bankSearch').fill('');await page.locator('#bankFilter').selectOption('movement');
 assert.equal(await page.locator('[data-game-sound]').count(),4);
 await page.locator('[data-game-preview="step-stone"]').click();await page.waitForFunction(()=>document.querySelector('.instru-bank-status').textContent.startsWith('Écoute ·'));
 await page.getByRole('button',{name:'■ Arrêter l’écoute'}).click();assert.equal(await page.locator('.instru-bank-status').textContent(),'Écoute arrêtée.');
 const zipWait=page.waitForEvent('download');await page.getByRole('button',{name:'Télécharger le pack filtré · ZIP'}).click();
 const zip=await readFile(await(await zipWait).path()),files=new Map();let at=0;
 while(zip.readUInt32LE(at)===0x04034b50){const size=zip.readUInt32LE(at+18),nameLength=zip.readUInt16LE(at+26),extra=zip.readUInt16LE(at+28),name=zip.subarray(at+30,at+30+nameLength).toString(),start=at+30+nameLength+extra;files.set(name,zip.subarray(start,start+size));at=start+size;}
 const manifest=JSON.parse(files.get('manifest.json').toString());assert.equal(manifest.sounds.length,4);assert.equal(files.size,6);
 for(const s of manifest.sounds){assert.equal(s.category,'movement');assert.deepEqual(files.get(s.file),Buffer.from(gameSoundWav(s.id)));}
 await page.locator('[data-game-add="step-stone"]').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('ajouté comme piste audio'));
 let saved=await save();assert.equal(saved.project.tracks.length,2);assert.deepEqual(saved.project.tracks[0],before.project.tracks[0]);
 const added=saved.project.tracks[1],asset=saved.assets.find(a=>a.id===added.clips[0].audioId);
 assert.equal(added.type,'audio');assert.ok(Math.abs(added.clips[0].length*60/project.bpm*4-.3)<.00001);assert.deepEqual(Buffer.from(asset.data,'base64'),Buffer.from(gameSoundWav('step-stone')));
 await page.locator('#undo').click();let undone=await save();assert.equal(undone.project.tracks.length,1);assert.equal(undone.assets.length,0);
 await page.locator('#redo').click();saved=await save();assert.equal(saved.project.tracks.length,2);
 await upload({...saved,project:{...saved.project,name:'Game sounds reopened'}});await page.reload();
 await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 const reopened=await save();assert.equal(reopened.project.tracks.length,2);assert.deepEqual(Buffer.from(reopened.assets[0].data,'base64'),Buffer.from(asset.data,'base64'));
 await open();await page.locator('#bankFilter').selectOption('ambience');
 await page.screenshot({path:folder+'/desktop.png'});
 for(const theme of ['forest','graphite','slate','light']){
  await page.locator('[aria-label="Thème de WarLike Studio"]').first().selectOption(theme);
  await page.setViewportSize({width:390,height:844});
  const boxes=await page.locator('[data-game-sound],.game-bank-tools button,[data-game-sound] button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{const b=n.getBoundingClientRect();return {left:b.left,right:b.right,clipped:n.matches('article')&&n.scrollHeight>n.clientHeight+2};}));
  assert.ok(boxes.length>0&&boxes.every(b=>b.left>=0&&b.right<=391&&!b.clipped),'game sound cards and actions fit mobile');
  await page.screenshot({path:folder+'/mobile-'+theme+'.png'});
 }
 // Every exported asset is decoded by Web Audio, independently of the encoder.
 const report=await page.evaluate(async()=>{
  const {GAME_SOUNDS,gameSoundWav}=await import('/game-sounds.js'),ctx=new OfflineAudioContext(1,1,48000),rows=[];
  for(const s of GAME_SOUNDS){const b=await ctx.decodeAudioData(gameSoundWav(s.id)),data=b.getChannelData(0);let peak=0,energy=0;for(const v of data){if(!Number.isFinite(v))throw Error(s.id+' nonfinite');peak=Math.max(peak,Math.abs(v));energy+=v*v;}if(peak<.1||peak>=1)throw Error(s.id+' silence/clipping');rows.push({id:s.id,frames:b.length,channels:b.numberOfChannels,sampleRate:b.sampleRate,peak,rms:Math.sqrt(energy/data.length)});}return rows;
 });
 assert.equal(report.length,24);assert.ok(report.every(r=>r.channels===1&&r.sampleRate===48000&&r.rms>.005));
 await writeFile(folder+'/audio-report.json',JSON.stringify(report,null,2));assert.deepEqual(errors,[]);
 console.log('PASS: 24 game WAVs decoded, preview/stop, pagination/search/category, filtered ZIP, native audio add, undo/redo, project export/import/cold reload and four mobile themes');
}catch(error){await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});console.error(errors);throw error;}finally{await browser.close();}
