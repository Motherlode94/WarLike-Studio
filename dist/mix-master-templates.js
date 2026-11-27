import {STUDIORACK_MIX_PRESETS} from './studiorack-mix-presets.js';
import {GENRE_INSTRUMENT_TEMPLATES,GENRE_MASTER_TEMPLATES} from './genre-instrument-master-templates.js';
import {EFFECTS,ensurePlugins,placeInsert,INSERT_COUNT,effectType} from './plugins.js';
import {MASTER_PRESETS,MASTER_MODULES,masteringSettings} from './mastering.js?v=0.15.12';

const template=(id,name,genre,category,description,stages)=>({id,name,genre,category,description,stages:stages.map(([effect,values])=>({id:effect,values}))});
const additions=[
 template('trap-vocal','TRAP / VOIX PRINCIPALE','Trap','Voix','Voix rap précise, compression et doublage discret.',[
  ['voxclean',{highpass:85,range:4}],['sibil',{range:5}],['voxlevel',{peakThreshold:-16,levelThreshold:-25,ratio:3}],['alterdouble',{mix:.12}],['alterecho',{mix:.13,feedback:.22}]]),
 template('drill-vocal','DRILL / VOIX DIRECTE','Drill','Voix','Voix centrée et sèche, délai court réservé aux phrases.',[
  ['voxclean',{highpass:100,range:5}],['sibil',{range:6}],['vectorcomp',{threshold:-23,ratio:3.5,attack:16,release:130,mix:.86}],['alterecho',{mix:.07,feedback:.18}]]),
 template('afro-lead','AFROBEAT / LEAD','Afrobeat','Voix','Chaleur, articulation et réverbération courte.',[
  ['voxclean',{highpass:78,range:3}],['voxlevel',{peakThreshold:-15,levelThreshold:-23,ratio:2.3}],['voxaireq',{presence:1,air:1.2}],['voxambience',{slap:102,room:.2,mix:.13}]]),
 template('amapiano-percs','AMAPIANO / PERCUSSIONS','Amapiano','Batterie','Groove aéré pour les percussions et le log drum.',[
  ['circuiteq',{body:.5,presence:1}],['vectorcomp',{threshold:-18,ratio:1.6,attack:35,release:180,mix:.65}],['exospace',{mix:.08}]]),
 template('rnb-vocal','R&B / SOUL LEAD','R&B / Soul','Voix','Dynamique souple, chaleur et profondeur vocale.',[
  ['voxclean',{highpass:75,range:3}],['sibil',{range:3}],['voxlevel',{peakThreshold:-14,levelThreshold:-22,ratio:2}],['voxaireq',{air:.8}],['voxambience',{room:.28,mix:.19}]]),
 template('gospel-choir','GOSPEL / CHŒURS','Gospel','Voix','Bus choral large, naturel et modérément comprimé.',[
  ['voxclean',{highpass:110,range:3}],['vectorcomp',{threshold:-19,ratio:1.7,attack:32,release:230,mix:.7}],['voxdoubler',{mix:.2}],['exospace',{mix:.2}]]),
 template('alt-rock-bus','ALT ROCK / DRUM BUS','Rock alternatif','Batterie','Cohésion de batterie avec attaques conservées.',[
  ['circuiteq',{body:.5,presence:1}],['circuitbus',{threshold:-18,ratio:2.5,attack:30,release:160,mix:.8}],['circuitcolor',{drive:2,mix:.12}]])
];
const genreFor=category=>({'Guitares':'Rock alternatif','Basse':'Trap','Batterie':'Afrobeat','Instruments':'R&B / Soul','Bus':'Mixage','Voix':'Vocal'})[category]||'Mixage';
export const MIX_TEMPLATES=Object.freeze([
 ...Object.entries(STUDIORACK_MIX_PRESETS).filter(([,p])=>p.category!=='Master').map(([id,p])=>({
  id,name:p.name,genre:genreFor(p.category),category:p.category,description:p.description,
  stages:p.stages.map(s=>({id:s.id,values:{...s.values}}))
 })),...additions,...GENRE_INSTRUMENT_TEMPLATES
]);
export const MASTER_TEMPLATES=Object.freeze([
 ...MASTER_PRESETS.filter(p=>p.name!=='Départ neutre').map((p,i)=>({
  id:'native-'+i,name:p.name,genre:genreFor(p.name.includes('Rock')?'Guitares':p.name.includes('Trap')?'Basse':'Bus'),
  category:'Master',description:p.description,settings:p.settings
 })),
 ...Object.entries(STUDIORACK_MIX_PRESETS).filter(([,p])=>p.category==='Master').map(([id,p])=>({
  id:'rack-'+id,name:p.name,genre:'Master',category:'Master',description:p.description,
  stages:p.stages.map(s=>({id:s.id,values:{...s.values}}))
 })),...GENRE_MASTER_TEMPLATES
]);
export const TEMPLATE_GENRES=Object.freeze(['Tous','Trap','Drill','Afrobeat','Amapiano','R&B / Soul','Gospel','Rock alternatif','Vocal','Mixage','Master']);
const checkValues=(definition,values,context)=>{
 if(!definition||!values||typeof values!=='object'||Array.isArray(values))throw Error('Module absent dans '+context);
 for(const [key,value] of Object.entries(values)){
  const c=definition.controls.find(c=>c.key===key);
  if(!c||!Number.isFinite(value)||value<c.min||value>c.max)throw Error('Paramètre invalide : '+context+'.'+key);
 }
};
export function validateTemplate(t,kind){
 if(!t||typeof t.id!=='string'||!t.name||!t.description)throw Error('Template invalide');
 if(kind==='mix'){
  if(!Array.isArray(t.stages)||!t.stages.length||t.stages.length>INSERT_COUNT)throw Error('Chaîne Mix invalide');
  for(const s of t.stages)checkValues(EFFECTS[s.id],s.values,t.id+'.'+s.id);
 }else if(kind==='master'){
  if(t.settings){for(const [id,value] of Object.entries(t.settings)){
   if(id==='inserts'||id==='bypass')continue;
   checkValues(MASTER_MODULES[id],Object.fromEntries(Object.entries(value).filter(([key])=>key!=='enabled')),t.id+'.'+id);
  }}else if(t.stages){
   if(t.stages.length>INSERT_COUNT||new Set(t.stages.map(s=>s.id)).size!==t.stages.length)throw Error('Chaîne Master invalide');
   for(const s of t.stages)checkValues(MASTER_MODULES[s.id],s.values,t.id+'.'+s.id);
  }else throw Error('Template Master vide');
 }else throw Error('Catégorie inconnue');
 return true;
}
export function mixTemplatePreview(t){validateTemplate(t,'mix');return t.stages.map((s,i)=>String(i+1).padStart(2,'0')+' · '+EFFECTS[s.id].name).join(' → ');}
export function masterTemplatePreview(t){validateTemplate(t,'master');const entries=t.stages||Object.entries(t.settings).filter(([id,v])=>MASTER_MODULES[id]&&v.enabled!==false).map(([id,values])=>({id,values}));return entries.map((s,i)=>String(i+1).padStart(2,'0')+' · '+MASTER_MODULES[s.id].name).join(' → ');}
export function applyMixTemplate(track,t,{mode='replace'}={}){
 validateTemplate(t,'mix');if(!['append','replace'].includes(mode))throw Error('Mode Mix invalide');
 ensurePlugins(track);
 const draft=structuredClone(track);
 if(mode==='replace'){
  for(const id of draft.inserts)if(id&&draft.effects[id])draft.effects[id].enabled=false;
  draft.inserts=Array(INSERT_COUNT).fill(null);
 }else if(draft.inserts.filter(x=>x===null).length<t.stages.length)throw Error('Pas assez d’inserts libres pour ce template');
 for(const stage of t.stages){
  const slot=draft.inserts.indexOf(null);
  if(slot<0)throw Error('Inserts saturés');
  const instance=placeInsert(draft,slot,stage.id);
  Object.assign(draft.effects[instance],stage.values,{enabled:true});
 }
 track.inserts=draft.inserts;track.effects=draft.effects;
 return t.name;
}
export function applyMasterTemplate(project,t){
 validateTemplate(t,'master');
 const settings=t.settings?structuredClone(t.settings):{
  inserts:t.stages.map(s=>s.id),bypass:false,
  ...Object.fromEntries(t.stages.map(s=>[s.id,{...s.values,enabled:true}]))
 };
 // MASTER_PRESETS historically omit inserts; infer their ordered active modules.
 const ordered=Object.keys(settings).filter(id=>MASTER_MODULES[id]&&settings[id]?.enabled===true);
 if(!settings.inserts)settings.inserts=ordered;
 project.mastering=masteringSettings(settings);
 return t.name;
}
