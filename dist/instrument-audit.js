import {INSTRUMENTS} from './plugins.js';
import {FACTORY_PRESETS} from './bundle.js';
import {ACOUSTIC_BANKS} from './acoustic.js';
import {ORIGINS_BANK} from './origins.js';
import {GUITAR_INSTRUMENTS,SYNTH_INSTRUMENTS} from './wl-instrument-packs.js';
import {DRUM_KIT_NAMES,requiredDrumFiles} from './recorded-drum-kits.js';
export function instrumentFamily(id){
 if(Object.hasOwn(ACOUSTIC_BANKS,id))return 'Échantillonné';
 if(Object.hasOwn(GUITAR_INSTRUMENTS,id))return 'Guitare modélisée';
 if(id==='sampler')return 'Sampler';
 if(id==='origins')return 'Vents modélisés';
 if(id==='wlvox')return 'Voix synthétique';
 if(id==='drums')return 'Percussions hybrides';
 if(id==='pluck')return 'Corde modélisée';
 return 'Synthèse';
}
export function instrumentAudit(){
 return Object.entries(INSTRUMENTS).map(([id,d])=>{
  const samples=ACOUSTIC_BANKS[id]?.samples||[],presets=FACTORY_PRESETS[id]||[],issues=[];
  const keys=new Set();
  for(const c of d.controls){if(keys.has(c.key)||![c.min,c.max,c.default,c.step].every(Number.isFinite)||c.min>c.max||c.step<=0||c.default<c.min||c.default>c.max)issues.push('Contrôle : '+c.key);keys.add(c.key);}
  for(const p of presets){for(const [key,v] of Object.entries(p.values||{})){const c=d.controls.find(c=>c.key===key);if(!c||!Number.isFinite(v)||v<c.min||v>c.max)issues.push(p.name+' / '+key);}for(const c of d.controls)if(!Object.hasOwn(p.values||{},c.key))issues.push(p.name+' / '+c.key+' absent');}
  return {id,name:d.name,family:instrumentFamily(id),controls:d.controls.length,presets:presets.length,samples:samples.length,bytes:samples.reduce((n,x)=>n+x.bytes,0),variants:id==='origins'?ORIGINS_BANK.length:id==='drums'?DRUM_KIT_NAMES.length:null,dependency:samples.length?'Banque locale':id==='sampler'?'Audio utilisateur':id==='drums'?'Kits 1–3 : réseau externe':'Autonome',issues};
 });
}
export function auditSummary(rows=instrumentAudit()){return {instruments:rows.length,controls:rows.reduce((n,r)=>n+r.controls,0),presets:rows.reduce((n,r)=>n+r.presets,0),samples:rows.reduce((n,r)=>n+r.samples,0),bytes:rows.reduce((n,r)=>n+r.bytes,0),issues:rows.reduce((n,r)=>n+r.issues.length,0),origins:ORIGINS_BANK.length,drumKits:DRUM_KIT_NAMES.length,externalDrumFiles:requiredDrumFiles().length};}
export function openInstrumentAudit(modal){
 modal('Inventaire instrumental','<section class="instrument-audit"><p id="instrumentAuditSummary" role="status"></p><div class="instrument-audit-filters"><label>Famille <select id="instrumentAuditFamily"></select></label><label>Rechercher <input id="instrumentAuditSearch" type="search" placeholder="Instrument ou identifiant"></label></div><div id="instrumentAuditRows" class="instrument-audit-rows"></div><p>Inventaire des définitions chargées, pas une attestation d’écoute ou de performance. Les kits acoustiques PULSE 1–3 utilisent une source réseau distincte.</p></section>','WARLIKE / R08 · INSTRUMENTS');
 const rows=instrumentAudit(),s=auditSummary(rows),family=document.getElementById('instrumentAuditFamily'),search=document.getElementById('instrumentAuditSearch'),out=document.getElementById('instrumentAuditRows');
 document.getElementById('instrumentAuditSummary').textContent=s.instruments+' instruments · '+s.presets+' presets · '+s.samples+' fichiers acoustiques · '+s.issues+' anomalies de définition';
 family.replaceChildren(new Option('Toutes',''),...[...new Set(rows.map(r=>r.family))].sort().map(v=>new Option(v,v)));
 function render(){const q=search.value.trim().toLowerCase();out.replaceChildren(...rows.filter(r=>(!family.value||r.family===family.value)&&[r.id,r.name,r.family].join(' ').toLowerCase().includes(q)).map(r=>{const el=document.createElement('article');el.dataset.auditInstrument=r.id;const title=document.createElement('strong');title.textContent=r.name+' · '+r.id;const info=document.createElement('small');info.textContent=r.family+' · '+r.controls+' contrôles · '+r.presets+' presets';const source=document.createElement('small');source.textContent=r.dependency+(r.samples?' · '+r.samples+' fichiers':r.variants!==null?' · '+r.variants+' variantes':'');el.append(title,info,source);if(r.issues.length){const warn=document.createElement('small');warn.textContent='À vérifier : '+r.issues.join(', ');el.append(warn);}return el;}));}
 family.onchange=render;search.oninput=render;render();
}
