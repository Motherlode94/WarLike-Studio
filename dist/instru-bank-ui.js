import {INSTRU_PRESETS} from './instru-presets.js';
import {INSTRUMENTS} from './plugins.js';
import {readPresetFavorites,setPresetFavorite,presetKey,presetMatches,presetPath} from './preset-organization.js';
const pages=new WeakMap(),options=new WeakMap();
const normal=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
export function filterInstruPresets(search='',category='all'){
 const words=normal(search).trim().split(/\s+/).filter(Boolean);
 return INSTRU_PRESETS.filter(p=>(category==='all'||p.category===category)&&words.every(w=>normal([p.name,p.category,p.description,p.tags,INSTRUMENTS[p.type].name,INSTRUMENTS[p.type].subtitle,p.type].join(' ')).includes(w)));
}
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
export function renderInstruBank({root,results,search,category,track,onPreview,onStop,onAdd,onApply}){
 const config=options.get(root)||{instrument:'all',favoritesOnly:false};
 const favorites=readPresetFavorites(typeof localStorage==='undefined'?null:localStorage);
 const paths=p=>['Instruments',p.category,INSTRUMENTS[p.type].name];
 const all=filterInstruPresets(search,category);
 const matches=all.filter(p=>(config.instrument==='all'||p.type===config.instrument)&&
  presetMatches({name:p.name,description:p.description,tags:p.tags,category:p.category,folders:paths(p),favoriteKey:presetKey('instru',p.id)},{favoritesOnly:config.favoritesOnly,favorites}));
 options.set(root,config);
 const signature=JSON.stringify([search,category,config.instrument,config.favoritesOnly]),previous=pages.get(root),total=Math.max(1,Math.ceil(matches.length/12));
 const state={signature,page:previous?.signature===signature?Math.min(previous.page,total-1):0};pages.set(root,state);
 const button=(text,action,kind='outline-btn')=>{const b=node('button',text,kind);b.type='button';b.onclick=()=>Promise.resolve().then(action).catch(error=>{status.textContent=error.message;});return b;};
 root.replaceChildren();root.classList.remove('pack-grid');root.classList.add('instru-bank-grid');let audition=0;
 results.textContent=matches.length+' / '+INSTRU_PRESETS.length+' sons';
 const intro=node('section',null,'instru-bank-intro');intro.append(node('h3','Banque Instru · sons WarLike'),node('p',INSTRU_PRESETS.length+' presets · 41 instruments · 8 harpes, 8 flûtes, 12 sons analogiques WL VANGUARD et 42 presets de guitares. Écoute le son, ajoute une piste avec une phrase de 2 mesures ou applique-le à une piste du même instrument.'));
 const status=node('output','Prêt à écouter · piste sélectionnée : '+(track?.name||'aucune'),'instru-bank-status');status.setAttribute('role','status');
 intro.append(status,button('■ Arrêter l’écoute',()=>{audition++;onStop();status.textContent='Écoute arrêtée.';}));
 const organization=node('div',null,'instru-bank-organization');
 const categoryLabel=node('label','Instruments / Famille / Banque / Preset');
 const chooser=node('select');chooser.id='instruFolder';chooser.setAttribute('aria-label','Sous-dossier des instruments');
 chooser.append(new Option('Tous les instruments','all'),...Object.entries(INSTRUMENTS).filter(([id])=>all.some(p=>p.type===id)).map(([id,def])=>new Option(def.name,id)));
 chooser.value=config.instrument;
 chooser.onchange=()=>{config.instrument=chooser.value;renderInstruBank({root,results,search,category,track,onPreview,onStop,onAdd,onApply});};
 categoryLabel.append(chooser);organization.append(categoryLabel);
 const only=node('label',null,'instru-favorites-toggle'),checkbox=node('input');checkbox.type='checkbox';checkbox.checked=config.favoritesOnly;
 checkbox.setAttribute('aria-label','Afficher seulement les sons favoris');
 checkbox.onchange=()=>{config.favoritesOnly=checkbox.checked;renderInstruBank({root,results,search,category,track,onPreview,onStop,onAdd,onApply});};
 only.append(checkbox,document.createTextNode('★ Favoris uniquement'));organization.append(only);
 intro.append(organization);root.append(intro);
 for(const patch of matches.slice(state.page*12,state.page*12+12)){
  const def=INSTRUMENTS[patch.type],card=node('article',null,'content-card instru-sound-card');card.dataset.instruSound=patch.id;card.style.setProperty('--card-color',def.color);
  card.append(node('div',patch.category+' · '+def.name,'content-card-type'),node('h3',patch.name),node('p',patch.description),node('small',patch.tags,'instru-sound-tags'));
  const actions=node('div',null,'content-card-actions');
  const preview=button('▶ Écouter',async()=>{const token=++audition;status.textContent='Chargement · '+patch.name;await onPreview(patch.id);if(status.isConnected&&token===audition)status.textContent='Écoute · '+patch.name+' · '+def.name;});preview.dataset.instruPreview=patch.id;
  const add=button('+ Ajouter piste',()=>onAdd(patch.id),'content-add');add.dataset.instruAdd=patch.id;
  const apply=button('Appliquer',()=>onApply(patch.id));apply.dataset.instruApply=patch.id;apply.disabled=track?.type!==patch.type;apply.title=apply.disabled?'Sélectionne une piste '+def.name+' ou ajoute une piste.':'Appliquer à '+track.name;
  const favorite=button(favorites.includes(presetKey('instru',patch.id))?'★':'☆',()=>{
  const now=!readPresetFavorites(localStorage).includes(presetKey('instru',patch.id));
  setPresetFavorite(localStorage,'instru',patch.id,now);
  renderInstruBank({root,results,search,category,track,onPreview,onStop,onAdd,onApply});
 });
 favorite.dataset.instruFavorite=patch.id;favorite.setAttribute('aria-label','Favori '+patch.name);
 favorite.setAttribute('aria-pressed',String(favorites.includes(presetKey('instru',patch.id))));
 actions.append(preview,add,apply,favorite);card.append(actions);root.append(card);
 }
 if(!matches.length)root.append(node('p','Aucun son trouvé. Essaie « harpe », « flûte », « supersaw », « pluck » ou « WL VANGUARD ».','bank-empty'));
 const pager=node('nav',null,'instru-bank-pager');pager.setAttribute('aria-label','Pages de la banque Instru');
 const move=delta=>{onStop();state.page+=delta;renderInstruBank({root,results,search,category,track,onPreview,onStop,onAdd,onApply});root.scrollTop=0;};
 const back=button('Précédent',()=>move(-1)),next=button('Suivant',()=>move(1));back.disabled=state.page===0;next.disabled=state.page===total-1;back.dataset.instruPage='previous';next.dataset.instruPage='next';
 pager.append(back,node('span','Page '+(state.page+1)+' / '+total),next);root.append(pager);
}
