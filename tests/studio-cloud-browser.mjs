// CI only: actual Studio UI + its Pages handlers + actual Server workerd/D1/R2.
// Browser routes bridge the public hostnames to the isolated runtime, never production.
import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join,resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,execFileSync} from 'node:child_process';
import {randomBytes,scryptSync,createHash} from 'node:crypto';
import {chromium,request as playwrightRequest} from 'playwright';
import {onRequest as proxy} from '../functions/api/studio/[[path]].js';
import {onRequestGet as availability} from '../functions/api/studio/availability.js';
import {onRequestPost as pair,onRequestDelete as logout} from '../functions/api/studio/session.js';
import {emptyProject} from '../dist/audio.js';
import {placeInsert} from '../dist/plugins.js';
import {encodeWav} from '../dist/wav.js';
if(process.env.GITHUB_ACTIONS!=='true')throw Error('Use the managed preview for local browser QA; this isolated runtime suite runs in GitHub Actions.');
const studio='https://warlike-studio.pages.dev',server='https://warlike-server.pages.dev',local='https://127.0.0.1:8791';
const root=process.cwd(),serverRoot=resolve('work/server'),output=resolve('artifacts/studio-cloud'),state=await mkdtemp(join(tmpdir(),'studio-cloud-'));
await mkdir(output,{recursive:true});
const password=randomBytes(24).toString('base64url'),salt=randomBytes(32),verifier=scryptSync(password,salt,32,{N:16384,r:8,p:5,maxmem:64*1024*1024}).toString('base64');
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const migrationFiles=(await readdir(join(serverRoot,'drizzle'))).filter(x=>x.endsWith('.sql')).sort();
let sql=(await Promise.all(migrationFiles.map(file=>readFile(join(serverRoot,'drizzle',file),'utf8')))).join('\n');
for(const [id,name,role] of [['WL-QA-OWNER','Cloud Owner','owner'],['WL-QA-ALICE','Cloud Alice','member'],['WL-QA-BOB','Cloud Bob','member']]){
 sql+=`\nINSERT INTO members(id,email,name,role,created_at) VALUES(${quote(id)},${quote(id.toLowerCase()+'@example.test')},${quote(name)},${quote(role)},1);`;
 sql+=`\nINSERT INTO hub_memberships(member_id,status,display_name,goal,interests,created_at,updated_at,decision_note) VALUES(${quote(id)},'active',${quote(name)},'Isolated test','["studio"]',1,1,'Isolated test');`;
 sql+=`\nINSERT INTO warlike_credentials(member_id,login,salt,verifier,iterations,version,must_change,updated_at) VALUES(${quote(id)},${quote(id.toLowerCase())},${quote(salt.toString('base64'))},${quote(verifier)},16384,1,0,1);`;
 sql+=`\nINSERT INTO grants(id,member_id,site,status,updated_at,updated_by) VALUES(${quote(crypto.randomUUID())},${quote(id)},'studio','active',1,'WL-QA-OWNER');`;
}
const seed=join(state,'seed.sql');await writeFile(seed,sql,{mode:0o600});
const wrangler=join(serverRoot,'node_modules/wrangler/bin/wrangler.js'),config=join(serverRoot,'dist/server/wrangler.json');
execFileSync(process.execPath,[wrangler,'d1','execute','DB','--config',config,'--local','--persist-to',state,'--file',seed],{stdio:'pipe'});
const runtime=spawn(process.execPath,[wrangler,'dev','--config',config,'--local','--persist-to',state,'--local-protocol','https','--upstream-protocol','https','--local-upstream','warlike-server.pages.dev','--ip','127.0.0.1','--port','8791','--inspector-port','0','--var','WARLIKE_OWNER_EMAIL:wl-qa-owner@example.test','--var','WARLIKE_BRIDGE_KEY:'+randomBytes(32).toString('base64url'),'--log-level','error'],{stdio:['ignore','pipe','pipe']});
let runtimeLog='';runtime.stdout.on('data',chunk=>runtimeLog+=chunk);runtime.stderr.on('data',chunk=>runtimeLog+=chunk);
const api=await playwrightRequest.newContext({ignoreHTTPSErrors:true});let browser;
const checks=[],errors=[];const passed=name=>{checks.push(name);console.log('PASS '+name)};
async function service(input){
 const url=new URL(typeof input==='string'?input:input.url);assert.equal(url.origin,server,'No production service requests');
 const method=typeof input==='string'?'GET':input.method,headers=typeof input==='string'?{}:Object.fromEntries(input.headers);
 headers.cookie??=''; // Never share APIRequestContext cookies across independent browser profiles.
 const data=typeof input==='string'||['GET','HEAD'].includes(method)?undefined:Buffer.from(await input.arrayBuffer());
 const reply=await api.fetch(local+url.pathname+url.search,{method,headers,data,maxRedirects:0});
 const resultHeaders=new Headers(reply.headers());resultHeaders.delete('content-encoding');resultHeaders.delete('content-length');
 return new Response([204,205,304].includes(reply.status())?null:await reply.body(),{status:reply.status(),headers:resultHeaders});
}
const env={WARLIKE_APP:{fetch:service}},mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.wav':'audio/wav','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
async function fulfill(route,response){await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())})}
async function installRoutes(context){
 await context.route(server+'/**',async route=>{
  const r=route.request(),headers=await r.allHeaders();delete headers.host;delete headers['content-length'];
  const response=await service(new Request(r.url(),{method:r.method(),headers,...(['GET','HEAD'].includes(r.method())?{}:{body:r.postDataBuffer()})}));await fulfill(route,response);
 });
 await context.route(studio+'/**',async route=>{
  const r=route.request(),url=new URL(r.url()),headers=await r.allHeaders();
  if(url.pathname.startsWith('/api/studio/')){
   const request=new Request(r.url(),{method:r.method(),headers,...(['GET','HEAD'].includes(r.method())?{}:{body:r.postDataBuffer()})});
   const path=url.pathname.slice('/api/studio/'.length),ctx={request,env,params:{path:path.split('/')}};
   const response=path==='availability'?await availability(ctx):path==='session'?(r.method()==='POST'?await pair(ctx):await logout(ctx)):await proxy(ctx);
   if(path==='session'||(response.status>=400&&path!=='me'))console.log('Studio facade',r.method(),path,response.status,await response.clone().text());
   return fulfill(route,response);
  }
  const path=resolve(root,'dist','.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(resolve(root,'dist')+sep))return route.fulfill({status:404,body:'Not found'});
  try{await route.fulfill({contentType:mime[extname(path)]||'application/octet-stream',headers:{'Cache-Control':'no-store'},body:await readFile(path)})}catch{await route.fulfill({status:404,body:'Not found'})}
 });
}
async function device(){const context=await browser.newContext({ignoreHTTPSErrors:true,acceptDownloads:true,viewport:{width:1440,height:1000}});await installRoutes(context);const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(studio);await page.locator('#libraryNew').waitFor({state:'visible'});return {context,page}}
async function connect(page,user){
 await page.locator('#studioCloudConnect').click();await page.getByRole('link',{name:'Se connecter à WarLike Server',exact:true}).click();
 await page.getByLabel('Identifiant',{exact:true}).fill('wl-qa-'+user);await page.getByLabel('Mot de passe',{exact:true}).fill(password);
 const [reply]=await Promise.all([page.waitForResponse(r=>r.url()===server+'/api/warlike-auth/login'),page.getByRole('button',{name:'Se connecter',exact:true}).click()]);assert.equal(reply.status(),200);
 await page.waitForURL(url=>url.origin===server&&url.pathname==='/connect/studio');await page.waitForLoadState('networkidle');
 const exchanged=page.waitForResponse(response=>response.url()===studio+'/api/studio/session'&&response.request().method()==='POST');
 await page.getByRole('button',{name:'Autoriser Studio',exact:true}).click();
 const exchange=await exchanged;if(exchange.status()!==200)throw Error('Studio session exchange '+exchange.status()+': '+await exchange.text());
 assert.ok((await page.context().cookies(studio)).some(cookie=>cookie.name==='__Host-warlike-studio'),'HttpOnly app cookie must be accepted before identity refresh');
 await page.waitForURL(studio+'/**');await page.getByText('Compte cloud : Cloud '+(user==='alice'?'Alice':'Bob'),{exact:true}).waitFor();
 assert.equal(new URL(page.url()).hash,'');assert.equal(await page.evaluate(()=>sessionStorage.getItem('warlike-studio-pkce')),null);
 const cookies=await page.context().cookies(studio);const cookie=cookies.find(x=>x.name==='__Host-warlike-studio');assert.ok(cookie?.httpOnly&&cookie.secure);assert.equal(cookie.sameSite,'Strict');
}
async function library(page){if(await page.locator('#modal').isVisible())await page.locator('#closeModal').click();await page.locator('#projectMenuBtn').click();await page.locator('#myProjects').click();await page.locator('#studioCloudSave').waitFor({state:'visible'})}
const samples=[Float32Array.from({length:48000},(_,i)=>.18*Math.sin(i*2*Math.PI*440/48000)),Float32Array.from({length:48000},(_,i)=>.12*Math.sin(i*2*Math.PI*660/48000))];
const wav=encodeWav({numberOfChannels:2,length:48000,sampleRate:48000,getChannelData:i=>samples[i]},{bits:24}),originalHash=createHash('sha256').update(new Uint8Array(wav)).digest('hex');
const project=emptyProject();project.name='Cloud voice round trip';project.bpm=123;project.bars=2;project.unknown={preserved:'future plugin data'};project.tracks[0].volume=-3;project.tracks[0].pan=.25;project.tracks[0].clips=[{id:'cloudclip1',name:'Synthetic stereo test',start:0,length:.5125,audioId:'cloudvoice1'}];placeInsert(project.tracks[0],0,'echo');
const archive={format:'chayah-studio',project,masterVolume:0,assets:[{id:'cloudvoice1',name:'Synthetic stereo.wav',data:Buffer.from(wav).toString('base64')}]};
try{
 for(let i=0;i<120;i++){try{const response=await service(server+'/api/health');if(response.ok)break;if(i===119)throw Error('Health '+response.status)}catch(error){if(i===119)throw error}if(runtime.exitCode!==null)throw Error('Worker exited '+runtime.exitCode);await new Promise(resolve=>setTimeout(resolve,500))}
 browser=await chromium.launch({headless:true,args:['--ignore-certificate-errors','--allow-insecure-localhost']});
 const a=await device();await connect(a.page,'alice');passed('Native WarLike login, Studio consent and HttpOnly session through the actual Server');
 await a.page.locator('#libraryImport').click();await a.page.locator('#projectInput').setInputFiles({name:'Synthetic stereo.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))});await a.page.getByText('Projet importé et sauvegardé.',{exact:true}).waitFor();await a.page.locator('#modal').waitFor({state:'hidden'});
 await library(a.page);await a.page.locator('#studioCloudSave').click();await a.page.getByText('Projet sauvegardé dans ton cloud WarLike.',{exact:true}).waitFor();
 await a.page.locator('#studioCloudOpen').click();await a.page.locator('[data-cloud-open]').waitFor({state:'visible'});const id=await a.page.locator('[data-cloud-open]').getAttribute('data-cloud-open');await a.page.screenshot({path:join(output,'alice-cloud-projects.png'),fullPage:true});passed('Actual Studio project and stereo WAV saved to isolated D1 and R2');
 const b=await device();assert.equal(await b.page.locator('[data-project-open]').count(),0);await connect(b.page,'alice');await b.page.locator('#studioCloudOpen').click();await b.page.locator('[data-cloud-open]').click();await b.page.locator('#modal').waitFor({state:'hidden'});
 await b.page.locator('#projectMenuBtn').click();const [download]=await Promise.all([b.page.waitForEvent('download'),b.page.locator('#saveProject').click()]);const restored=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.equal(restored.project.bpm,123);assert.equal(restored.project.tracks[0].volume,-3);assert.equal(restored.project.tracks[0].pan,.25);assert.deepEqual(restored.project.tracks[0].inserts,project.tracks[0].inserts);assert.deepEqual(restored.project.unknown,project.unknown);
 assert.equal(createHash('sha256').update(Buffer.from(restored.assets[0].data,'base64')).digest('hex'),originalHash);await b.page.screenshot({path:join(output,'alice-restored-session.png'),fullPage:true});passed('Second browser profile restores arrangement, inserts and byte-identical stereo WAV');
 const revision=await a.page.evaluate(async id=>{const {StudioCloudClient}=await import('/studio-cloud-client.js');window.revisionClient=new StudioCloudClient({baseUrl:location.origin});await window.revisionClient.identity();return (await window.revisionClient.getProject(id)).revision},id);
 await b.page.evaluate(async ({id,revision})=>{const {StudioCloudClient}=await import('/studio-cloud-client.js');const api=new StudioCloudClient({baseUrl:location.origin});await api.identity();const latest=await api.getProject(id);await api.saveProject(id,{...latest.project,bpm:124},revision)},{id,revision});
 assert.equal(await a.page.evaluate(async ({id,revision,project})=>{try{await window.revisionClient.saveProject(id,project,revision);return 200}catch(error){return error.status}},{id,revision,project:restored.project}),409);passed('Two actual Server writes at the same revision conflict without overwriting the first save');
 const bob=await device();await connect(bob.page,'bob');await bob.page.locator('#studioCloudOpen').click();await bob.page.getByText('Aucun projet cloud.',{exact:true}).waitFor();
 const denied=await bob.page.evaluate(async ({id,asset})=>{const {StudioCloudClient}=await import('/studio-cloud-client.js');const api=new StudioCloudClient({baseUrl:location.origin});await api.identity();const results=[];for(const action of [()=>api.getProject(id),()=>api.downloadAsset(id,asset)]){try{await action();results.push(200)}catch(error){results.push(error.status)}}return results},{id,asset:restored.project.__cloudAssets.cloudvoice1});assert.deepEqual(denied,[404,404]);passed('Actual Server rejects Bob listing and accessing Alice project/media');
 await b.page.evaluate(async()=>{const {createStudioSync}=await import('/studio-cloud-workflow.js');window.raceSync=createStudioSync();await window.raceSync.connect()});
 // Simulate the shared HttpOnly cookie being changed without a BroadcastChannel notification.
 const bobCookie=(await bob.context.cookies(studio)).find(x=>x.name==='__Host-warlike-studio');await b.context.addCookies([bobCookie]);
 const blocked=await b.page.evaluate(async()=>{try{await window.raceSync.push({project:{name:'Alice secret must never become Bob data',tracks:[]},assets:[]});return 200}catch(error){return {status:error.status,code:error.code,identity:window.raceSync.identity()}}});assert.deepEqual(blocked,{status:401,code:'ACCOUNT_CHANGED',identity:null});
 assert.equal(await bob.page.evaluate(async()=>{const {StudioCloudClient}=await import('/studio-cloud-client.js');const api=new StudioCloudClient({baseUrl:location.origin});await api.identity();return (await api.listProjects()).length}),0);passed('Silent cross-tab cookie replacement cannot publish Alice data as Bob');
 await library(b.page);await b.page.locator('#studioCloudSave').click();await b.page.getByText('Ce projet est associé à un autre compte WarLike.',{exact:true}).waitFor();passed('Existing local cloud association cannot be reassigned to another account');
 const second=await a.context.newPage();second.on('pageerror',error=>errors.push(error.message));await second.goto(studio);await second.locator('#studioCloudOpen').click();await second.locator('[data-cloud-open]').waitFor({state:'visible'});
 await library(a.page);await a.page.locator('#studioCloudLogout').click();await second.locator('#modal').waitFor({state:'hidden'});
 assert.equal((await a.context.cookies(studio)).some(x=>x.name==='__Host-warlike-studio'),false);await a.page.locator('#studioCloudOpen').click();await a.page.getByText('Connexion WarLike requise.',{exact:true}).waitFor();passed('Logout revokes the actual session and closes private cloud lists in sibling tabs');
 assert.deepEqual(errors,[]);passed('No browser page errors');
 await writeFile(join(output,'report.json'),JSON.stringify({serverCommit:process.env.STUDIO_QA_SERVER_COMMIT,checks,passed:checks.length,audio:{channels:2,frames:48000,sampleRate:48000,bits:24,sha256:originalHash},limits:'Independent browser profiles and synthetic PCM, not two physical machines or real microphones.'},null,2)+'\n');
}catch(error){let index=0;for(const context of browser?.contexts()||[])for(const page of context.pages()){try{await page.screenshot({path:join(output,'failure-'+index+'.png'),fullPage:true});console.error('Page '+index+': '+(await page.locator('body').innerText()).slice(-1400));index++}catch{}}throw error;
}finally{await browser?.close();await api.dispose();runtime.kill('SIGTERM');await new Promise(resolve=>{if(runtime.exitCode!==null)return resolve();runtime.once('exit',resolve);setTimeout(resolve,5000).unref()});if(checks.length<8)console.error(runtimeLog.replaceAll(password,'[redacted]').replace(/(challenge|state|warlike_studio_pair)=[^\s&]+/g,'$1=[redacted]'));await rm(state,{recursive:true,force:true})}
