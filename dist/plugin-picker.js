const groups={tilteq:'EQ',notch:'EQ',slap:'Delay',circuiteq:'EQ',vectoreq:'EQ',circuitbus:'Dynamique',vectorcomp:'Dynamique',vectorlimit:'Dynamique',voxlevel:'Voix',voxclean:'Voix',voxtune:'Voix',circuitcolor:'Saturation',alterdouble:'Modulation',alterecho:'Delay',alterfilter:'Modulation',sculpt:'EQ',prism:'EQ',balance:'EQ',glue:'Dynamique',press:'Dynamique',peak:'Dynamique',hush:'Voix',sibil:'Voix',exofocus:'Voix',color:'Saturation',ember:'Saturation',exoair:'Saturation',echo:'Delay',relay:'Delay',aura:'Réverbération',exospace:'Réverbération',orbit:'Modulation',sway:'Modulation',phase:'Modulation',ring:'Modulation',exostrip:'Channel strip'};
const key='warlike.plugin.favorites.v1',normal=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
export function pluginCategory(id,def){return groups[id]||({origins:'Vents du monde',sampler:'Sampler',piano:'Pianos & claviers',upright:'Pianos & claviers',epiano:'Pianos & claviers',harp:'Cordes pincées',strum:'Cordes pincées',violin:'Cordes frottées',cello:'Cordes frottées',flute:'Vents',trumpet:'Vents',marimba:'Percussions mélodiques',vibes:'Percussions mélodiques',kalimba:'Percussions mélodiques',drums:'Batterie'})[id]||'Synthétiseurs';}
// Index the control labels as well as the effect title. Users can discover a
// processor by what they need to change (threshold, feedback, formants, etc.).
// Every query word must match, but words need not be adjacent or ordered.
export function pluginBundle(id,def){
 if(id==='origins')return 'ORIGINS';
 const family=/^(vector|circuit|vox|exo|alter)/.exec(id)?.[1];
 return family?({vox:'VOX LAB',vector:'VECTOR',circuit:'CIRCUIT',exo:'EXO',alter:'ALTER'})[family]:def?.pack?String(def.pack).toUpperCase():'Native Plugins';
}
export function pluginTree(items){
 const bundles=new Map();
 for(const item of items){
  const [id,def]=item,bundle=pluginBundle(id,def),category=pluginCategory(id,def);
  if(!bundles.has(bundle))bundles.set(bundle,new Map());
  const categories=bundles.get(bundle);
  if(!categories.has(category))categories.set(category,[]);
  categories.get(category).push(item);
 }
 return bundles;
}
export function pluginSearchText(id,def){
 const controls=Array.isArray(def?.controls)?def.controls:[];
 return normal([id,def?.name,def?.subtitle,def?.description,def?.pack,
  pluginCategory(id,def),pluginBundle(id,def),...controls.flatMap(c=>[c?.name,c?.key])]
  .filter(x=>typeof x==='string').join(' '));
}
export function filterPluginChoices(registry,{query='',category='all',favorites=[],favoritesOnly=false}={}){
 const terms=normal(query).trim().split(/\s+/).filter(Boolean);
 return Object.entries(registry).filter(([id,def])=>
  (category==='all'||pluginCategory(id,def)===category)
  &&(!favoritesOnly||favorites.includes(id))
  &&terms.every(term=>pluginSearchText(id,def).includes(term)));
}
export function mountPluginPicker({root,registry,onChoose,selected=null,esc,disabledIds=[]}){
 let favorites=[];try{const data=JSON.parse(localStorage.getItem(key));if(Array.isArray(data))favorites=data.filter(x=>typeof x==='string').slice(0,128);}catch{}
 const state={query:'',category:'all',favorites,favoritesOnly:false},host=document.createElement('section');host.className='plugin-picker';
 const categories=[...new Set(Object.entries(registry).map(([id,d])=>pluginCategory(id,d)))];host.innerHTML=`<div class="picker-search"><input id="pluginSearch" aria-label="Rechercher un plugin" placeholder="Rechercher un plugin…" autocomplete="off"><button id="pluginFavoritesOnly" class="outline-btn" aria-pressed="false">★ Favoris</button></div><div class="picker-categories"><button data-picker-category="all" class="chosen">Tous</button>${categories.map(c=>`<button data-picker-category="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="pluginPickerResults" class="picker-results"></div>`;root.prepend(host);
 const result=host.querySelector('#pluginPickerResults'),expanded=new Map();
 result.style.display='block';
 function render(){const items=filterPluginChoices(registry,state);
 const row=([id,d])=>(`<div class="picker-row ${id===selected?'current':''}"><button data-picker-load="${id}" class="picker-choice" ${disabledIds.includes(id)?'disabled title="Déjà inséré sur le Master"':''}><strong>${esc(d.name)}</strong><span>${esc(d.subtitle)}</span><small>${esc(pluginCategory(id,d))}${d.pack?' · '+esc(d.pack.toUpperCase()):''}</small></button><button data-picker-favorite="${id}" class="picker-star" aria-label="Favori ${esc(d.name)}" aria-pressed="${state.favorites.includes(id)}">${state.favorites.includes(id)?'★':'☆'}</button></div>`) ;
 const folder=(name,path,body)=>`<details data-picker-folder="${esc(path)}" ${state.query||expanded.get(path)!==false?'open':''}><summary style="cursor:pointer;padding:7px 8px;font-weight:600">${esc(name)}</summary><div style="padding-inline-start:12px">${body}</div></details>`;
 result.innerHTML=[...pluginTree(items)].map(([bundle,cats])=>folder(bundle,bundle,[...cats].map(([cat,entries])=>folder(cat,bundle+'/'+cat,entries.map(row).join(''))).join(''))).join('')||'<p class="picker-empty">Aucun plugin trouvé.</p>';
 result.querySelectorAll('details').forEach(node=>node.addEventListener('toggle',()=>{if(node.isConnected&&!state.query)expanded.set(node.dataset.pickerFolder,node.open);}));
 }
 host.querySelector('input').oninput=e=>{state.query=e.target.value;render();};host.querySelector('#pluginFavoritesOnly').onclick=e=>{state.favoritesOnly=!state.favoritesOnly;e.currentTarget.setAttribute('aria-pressed',state.favoritesOnly);render();};
 host.onclick=e=>{const category=e.target.closest('[data-picker-category]');if(category){state.category=category.dataset.pickerCategory;host.querySelectorAll('[data-picker-category]').forEach(b=>b.classList.toggle('chosen',b===category));render();return;}const star=e.target.closest('[data-picker-favorite]');if(star){const id=star.dataset.pickerFavorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];try{localStorage.setItem(key,JSON.stringify(state.favorites));}catch{}render();return;}const choice=e.target.closest('[data-picker-load]');if(choice&&!choice.disabled)onChoose(choice.dataset.pickerLoad);};
 host.onkeydown=e=>{const buttons=[...result.querySelectorAll('[data-picker-load]:not(:disabled)')].filter(b=>b.getClientRects().length);if(!buttons.length)return;const i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[i<0?(e.key==='ArrowDown'?0:buttons.length-1):(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}else if(e.key==='Enter'&&e.target.matches('input')&&state.query.trim()){e.preventDefault();if(buttons[0])onChoose(buttons[0].dataset.pickerLoad);}};render();requestAnimationFrame(()=>host.querySelector('input').focus());return host;
}
