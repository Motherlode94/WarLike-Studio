import {SESSION_TEMPLATES} from './content.js';
import {fullSongBars} from './full-song.js';
import {mountSessionPreview} from './session-preview-ui.js';
const node=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
const button=(text)=>{const n=node('button',text,'outline-btn');n.type='button';return n;};
export function mountProjectCompositions(root,{stop,sync}){
 const short=node('section',null,'project-short-demos');
 while(root.firstChild)short.append(root.firstChild);
 const complete=node('section',null,'project-home-compositions');
 const title=node('h3','Compositions complètes · '+SESSION_TEMPLATES.length+' morceaux');
 const copy=node('p','Écoute un extrait de 4 mesures, puis ouvre une copie indépendante avec toutes ses pistes et sa structure complète.');
 const list=node('div',null,'project-composition-list'),pager=node('nav',null,'session-dashboard-pager');pager.setAttribute('aria-label','Pages des compositions');
 const previous=button('Précédent'),next=button('Suivant'),position=node('span');position.setAttribute('role','status');
 previous.dataset.compositionPage='previous';next.dataset.compositionPage='next';position.dataset.compositionPageStatus='';
 pager.append(previous,position,next);complete.append(title,copy,list,pager);
 const pageSize=3,pages=Math.ceil(SESSION_TEMPLATES.length/pageSize);let page=0;
 function render(){
  list.replaceChildren();
  for(const item of SESSION_TEMPLATES.slice(page*pageSize,(page+1)*pageSize)){
   const bars=item.bars||fullSongBars(item.bpm),seconds=Math.round(bars*240/item.bpm);
   const row=node('article',null,'project-composition-row');row.dataset.composition=item.id;
   const info=node('div'),name=node('strong',item.name),meta=node('small',item.style+' · '+item.bpm+' BPM · '+bars+' mesures · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));
   info.append(name,meta);
   const actions=node('div',null,'project-composition-actions'),listen=button('▶ Écouter'),open=button('Ouvrir');
   listen.dataset.sessionPreview=item.id;listen.dataset.previewName=item.name;listen.setAttribute('aria-pressed','false');listen.setAttribute('aria-label','Écouter un extrait de '+item.name);
   open.dataset.factoryProjectOpen=item.id;open.setAttribute('aria-label','Ouvrir une copie de '+item.name);open.className='primary-btn';
   actions.append(listen,open);row.append(info,actions);list.append(row);
  }
  previous.disabled=page===0;next.disabled=page===pages-1;position.textContent='Page '+(page+1)+' / '+pages;sync();
 }
 previous.onclick=()=>{stop();page--;render();};next.onclick=()=>{stop();page++;render();};
 const nav=node('nav',null,'project-demo-catalogs');nav.setAttribute('aria-label','Types de démos');
 for(const [key,label] of [['complete','Compositions complètes'],['short','Démos courtes · 16 mesures']]){
  const b=button(label);b.dataset.demoCatalog=key;nav.append(b);
  b.onclick=()=>select(key);
 }
 function select(key){stop();complete.hidden=key!=='complete';short.hidden=key!=='short';for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.demoCatalog===key));sync();}
 root.append(nav,complete,short);mountSessionPreview(complete,stop);render();select('complete');
}
