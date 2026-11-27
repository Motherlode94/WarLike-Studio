import {captureRack,serializeRack,parseRack} from './war-rack10.js';
import {suggestHeadroom} from './war-rack03.js';
import {trimStage} from './war-rack07.js';
import {WAR_RACKS} from './war-rack-catalog.js';
import {matchesTarget,planRack,applyRack} from './war-rack-core.js';
const searchText=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterRacks(catalog,{track,stage='all',source='all',genre='all',query=''}={}){
 const q=searchText(query.trim());
 return catalog.filter(r=>matchesTarget(r,track)&&(stage==='all'||r.stage===stage)&&(source==='all'||r.source===source)&&(genre==='all'||r.genre===genre||r.genre==='Tous')&&searchText([r.name,r.source,r.genre,r.description].join(' ')).includes(q));
}
export function adaptRackHeadroom(r,result){
 if(!r||r.stage!=='premix')throw Error('Choisis une chaîne prémix.');
 if(result.gainDb===null||!Number.isFinite(result.gainDb)||result.gainDb>0)throw Error('Source silencieuse, saturée ou invalide : corriger avant le rack.');
 if(result.gainDb< -12)throw Error('Réduction conseillée '+result.gainDb.toFixed(1)+' dB : corrige le niveau source avant la chaîne (trim limité à 12 dB).');
 const stages=structuredClone(r.stages),first=stages[0];
 if(first?.id==='tilteq'&&first.values.tilt===0&&first.values.mix===1){
  first.values.output=trimStage((first.values.output??0)+result.gainDb).values.output;
 }else if(result.gainDb!==0)stages.unshift(trimStage(result.gainDb));
 return {...r,stages};
}
export function mountRackBrowser(root,{track,project,apply,measureSource}){
 root.innerHTML=`<div class="mix-master-template-picker">
 <p>Choisis une chaîne par source et étape. Chaque effet reste réglable dans sa fenêtre individuelle.</p>
 <div class="war-rack-file-actions"><button type="button" class="outline-btn" data-save>Enregistrer la chaîne actuelle (.json)</button><label>Importer un preset<input type="file" data-import accept=".json,application/json"></label></div>
 <div class="mix-master-template-filters"><label>Étape<select data-stage></select></label><label>Source<select data-source></select></label><label>Genre<select data-genre></select></label><label>Recherche<input type="search" data-query placeholder="Nom, source, genre…"></label></div>
 <div class="mix-master-template-content"><div data-list class="mix-master-template-list" aria-label="Racks disponibles"></div>
 <section class="mix-master-template-detail"><h3 data-name></h3><p data-desc></p><ol data-chain></ol><label>Mode<select data-mode><option value="replace">Remplacer</option><option value="append">Ajouter</option></select></label>
 <button type="button" class="outline-btn" data-measure hidden>Mesurer le gain de la source</button><button type="button" class="primary-btn" data-apply>Appliquer le rack</button><p role="status" aria-live="polite"></p></section></div></div>`;
 const $=s=>root.querySelector(s),stage=$('[data-stage]'),source=$('[data-source]'),genre=$('[data-genre]'),mode=$('[data-mode]'),button=$('[data-apply]'),status=$('[role=status]'),measure=$('[data-measure]');
 let catalog=[...WAR_RACKS],selected=null,adapted=null,busy=false,revision=0;
 const candidates=catalog.filter(r=>matchesTarget(r,track));
 const fill=(el,values)=>el.replaceChildren(new Option('Tous','all'),...values.map(v=>new Option(v,v)));
 fill(stage,[...new Set(candidates.map(r=>r.stage))]);fill(source,[...new Set(candidates.map(r=>r.source))].sort());fill(genre,[...new Set(candidates.map(r=>r.genre))].sort());
 if(!track)mode.disabled=true;
 function render(){
  const rows=filterRacks(catalog,{track,stage:stage.value,source:source.value,genre:genre.value,query:$('[data-query]').value});
  if(!rows.includes(selected)){selected=rows[0]||null;adapted=null;}
  $('[data-list]').replaceChildren(...rows.map(r=>{
   const b=document.createElement('button');b.className='mix-master-template-option';b.type='button';b.textContent=r.name+' · '+r.source;b.setAttribute('aria-pressed',String(r===selected));
   b.onclick=()=>{revision++;selected=r;adapted=null;render();};return b;
  }));
  $('[data-name]').textContent=selected?.name||'Aucun rack';$('[data-desc]').textContent=selected?.description||'';$('[data-chain]').replaceChildren();button.disabled=true;status.textContent='';
  measure.hidden=!(measureSource&&selected?.stage==='premix');measure.disabled=busy;
  if(!selected)return;
  try{
   const plan=planRack(adapted||selected,{track,project,mode:mode.value});
   for(const p of plan.stages){const li=document.createElement('li');li.textContent=p.name+' — '+Object.entries(p.values).map(([k,v])=>k+': '+v).join(' · ');$('[data-chain]').append(li);}
   status.textContent=plan.stages.length+' effets / '+plan.available+' places disponibles';button.disabled=busy;
  }catch(error){status.textContent=error.message;}
 }
 const change=()=>{revision++;adapted=null;render();};
 for(const el of [stage,source,genre,mode])el.onchange=change;
 $('[data-query]').oninput=change;
 button.onclick=async()=>{
  if(busy||button.disabled||!selected)return;
  busy=true;render();let error;
  try{await apply(adapted||selected,mode.value,applyRack);}catch(e){error=e.message;}
  finally{busy=false;if(root.isConnected){render();if(error)status.textContent=error;}}
 };
 $('[data-save]').onclick=()=>{
  try{
   const label=prompt('Nom du preset',selected?.name||track?.name||'Master');if(!label?.trim())return;
   const r=captureRack({track,project,name:label,source:selected?.source||(track?.type==='bus'?'Bus':track?.type==='audio'?'Lead Vocal':track?.type==='drums'?'Drums':track?'Other':'Master'),stage:selected?.stage||(track?'mix':'master'),genre:selected?.genre||'Tous'});
   const url=URL.createObjectURL(new Blob([serializeRack(r)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='war-rack.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   status.textContent='Chaîne active enregistrée ; effets bypassés exclus.';
  }catch(error){status.textContent=error.message;}
 };
 $('[data-import]').onchange=async()=>{
  const file=$('[data-import]').files[0];$('[data-import]').value='';
  if(!file)return;
  const ticket=++revision;
  try{
   if(file.size>262144)throw Error('Fichier trop volumineux (256 Ko maximum).');
   const r=parseRack(await file.text());if(ticket!==revision||!root.isConnected)return;
   if(!matchesTarget(r,track))throw Error('Preset incompatible avec la destination.');
   catalog=[...catalog,r];for(const [el,v] of [[stage,r.stage],[source,r.source],[genre,r.genre]])if(![...el.options].some(o=>o.value===v))el.append(new Option(v,v));
   stage.value=source.value=genre.value='all';$('[data-query]').value='';selected=r;adapted=null;render();
  }catch(error){if(ticket===revision&&root.isConnected)status.textContent=error.message;}
 };
 measure.onclick=async()=>{
  if(busy||!selected||!measureSource)return;
  const r=selected,ticket=++revision;busy=true;render();let message='';
  try{
   const result=suggestHeadroom(await measureSource());if(ticket!==revision||!root.isConnected)return;
   adapted=adaptRackHeadroom(r,result);planRack(adapted,{track,project,mode:mode.value});
   message='Crête source '+result.peakDb.toFixed(1)+' dBFS · trim proposé '+result.gainDb.toFixed(1)+' dB ; appliquer pour confirmer.';
  }catch(error){if(ticket===revision)message=error.message;}
  finally{busy=false;if(root.isConnected){render();if(message&&ticket===revision)status.textContent=message;}}
 };
 render();
}
