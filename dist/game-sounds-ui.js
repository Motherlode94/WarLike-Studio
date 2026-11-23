import {GAME_SOUNDS,GAME_SOUND_CATEGORIES,filterGameSounds} from './game-sounds.js';
const pages=new WeakMap();
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
export function renderGameSoundBank({root,results,search,category,onPreview,onStop,onAdd,onWav,onPack}){
 const signature=JSON.stringify([search,category]),old=pages.get(root),matches=filterGameSounds(search,category),total=Math.max(1,Math.ceil(matches.length/12));
 const state={signature,page:old?.signature===signature?Math.min(old.page,total-1):0};pages.set(root,state);
 root.replaceChildren();root.classList.remove('pack-grid');root.classList.add('instru-bank-grid');
 results.textContent=matches.length+' / '+GAME_SOUNDS.length+' sons de jeu';
 const status=node('output','Prêt à écouter · WAV mono 24 bits / 48 kHz','instru-bank-status');status.setAttribute('role','status');
 let serial=0;
 const button=(label,action)=>{const b=node('button',label,'outline-btn');b.type='button';b.onclick=async()=>{b.disabled=true;try{await action();}catch(error){status.textContent=error.message;}finally{if(b.isConnected)b.disabled=false;}};return b;};
 const intro=node('section',null,'instru-bank-intro');
 intro.append(node('h3','Sons pour Engine'),node('p','24 sons originaux de synthèse pour tes jeux. Écoute, ajoute une piste audio dans Studio ou télécharge un WAV sec. Le pack ZIP contient les sons du filtre actif, rangés en dossiers. Les ambiances sont des extraits avec fondus, sans boucle automatique.'),status);
 const actions=node('div',null,'game-bank-tools');
 const stop=button('■ Arrêter l’écoute',()=>{serial++;onStop();status.textContent='Écoute arrêtée.';});
 const pack=button('Télécharger le pack filtré · ZIP',()=>onPack(search,category));pack.disabled=!matches.length;
 actions.append(stop,pack);intro.append(actions);root.append(intro);
 for(const s of matches.slice(state.page*12,state.page*12+12)){
  const card=node('article',null,'content-card instru-sound-card');card.dataset.gameSound=s.id;card.style.setProperty('--card-color','#83c4bd');
  card.append(node('div',GAME_SOUND_CATEGORIES[s.category]+' · '+s.duration+' s','content-card-type'),node('h3',s.name),node('p','Synthèse originale · mono · WAV 24 bits · 48 kHz'));
  const row=node('div',null,'content-card-actions');
  const preview=button('▶ Écouter',async()=>{const token=++serial;status.textContent='Chargement · '+s.name;const played=await onPreview(s.id);if(token===serial&&status.isConnected&&played!==false)status.textContent='Écoute · '+s.name;});preview.dataset.gamePreview=s.id;
  const add=button('+ Ajouter piste',()=>onAdd(s.id));add.dataset.gameAdd=s.id;
  const wav=button('Télécharger WAV',()=>onWav(s.id));wav.dataset.gameWav=s.id;
  row.append(preview,add,wav);card.append(row);root.append(card);
 }
 if(!matches.length)root.append(node('p','Aucun son trouvé. Essaie « laser », « pas », « soin » ou « pluie ».','bank-empty'));
 const pager=node('nav',null,'instru-bank-pager');pager.setAttribute('aria-label','Pages des sons pour Engine');
 const move=delta=>{onStop();state.page+=delta;renderGameSoundBank({root,results,search,category,onPreview,onStop,onAdd,onWav,onPack});root.scrollTop=0;};
 const back=button('Précédent',()=>move(-1)),next=button('Suivant',()=>move(1));back.disabled=state.page===0;next.disabled=state.page===total-1;
 back.dataset.gamePage='previous';next.dataset.gamePage='next';pager.append(back,node('span','Page '+(state.page+1)+' / '+total),next);root.append(pager);
}
