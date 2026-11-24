import {effectFace,effectReadout,effectDialFraction,effectHardwareIdentity} from './effect-face-model.js';
const panels=new WeakMap(),svgNS='http://www.w3.org/2000/svg';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const emblems={
 eq:'M8 62H212 M18 70V15 M18 52Q54 52 67 27T115 48T164 24T210 49',
 dynamics:'M18 74V10 M18 74H210 M25 67L90 32 118 30H206 M90 75V22',
 space:'M20 46Q55 -2 89 46T158 46T210 46 M25 73H205',
 echo:'M18 19V75 M50 35V75 M82 47V75 M114 55V75 M146 61V75 M178 65V75',
 modulation:'M10 40Q35 6 60 40T110 40T160 40T210 40 M10 60Q35 26 60 60T110 60T160 60T210 60',
 drive:'M10 76L45 70Q64 67 73 22H151Q160 67 180 70L211 76',
 vocal:'M10 54H31L43 19 60 75 79 11 97 59H123L143 22 158 73 177 40 194 54H210',
 generic:'M20 20H70V70H20Z M100 20H150V70H100Z M180 20H210V70H180Z M70 45H100 M150 45H180'
};
function emblem(kind){
 const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 220 90');svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS(svgNS,'path');path.setAttribute('d',emblems[kind]);svg.append(path);return svg;
}
export function mountEffectFace(panel,{id,definition,state,formatValue}){
 const spec=effectFace(id,definition),params=panel.querySelector('.plugin-window-params');
 if(!spec||!params||panel.dataset.effectFace)return false;
 const controls=[...params.querySelectorAll('.param')],byKey=new Map(controls.map(node=>[node.querySelector('[data-param]')?.dataset.param?.split('.').at(-1),node]));
 if(byKey.size!==definition.controls.length||spec.groups.some(g=>g.keys.some(k=>!byKey.has(k))))return false;
 // Specialized hardware (e.g. VECTOR EQ frequency bands) already groups its
 // controls; never discard its native grouping, graphs or event listeners.
 if(controls.every(node=>node.parentElement===params)){
  params.replaceChildren(...spec.groups.map(group=>{
   const section=el('section',null,'effect-control-group');section.dataset.effectGroup=group.name;
   section.append(el('h3',group.name));for(const key of group.keys){const node=byKey.get(key);node.dataset.effectControl=key;section.append(node);}
   return section;
  }));
 }else for(const [key,node] of byKey)node.dataset.effectControl=key;
 const hardware=effectHardwareIdentity(id,definition);
 panel.dataset.effectFace=id;panel.dataset.effectKind=spec.kind;
 panel.dataset.effectHardware=hardware.geometry;panel.dataset.effectVariant=hardware.variant;
 panel.style.setProperty('--fx-accent',hardware.accent);
 const head=el('header',null,'effect-face-heading'),identity=el('div',null,'effect-face-identity'),readouts=el('div',null,'effect-face-readouts');
 identity.append(el('small',spec.label),el('h2',definition.name),el('p',definition.subtitle));
 const plate=el('div',null,'effect-hardware-plate');
 plate.dataset.effectEngraving=hardware.engraving;
 plate.append(el('strong',hardware.engraving),el('small','WARLIKE · '+hardware.serial));
 plate.setAttribute('aria-label','Identité du processeur '+definition.name);
 identity.append(plate);
 for(const key of spec.focus){
  const control=definition.controls.find(c=>c.key===key),card=el('div',null,'effect-face-macro');
  card.append(el('small',control.name));const value=el('output');value.dataset.effectReadout=key;card.append(value);
  const track=el('span',null,'effect-macro-track'),fill=el('span',null,'effect-macro-fill');fill.dataset.effectFill=key;track.append(fill);card.append(track);readouts.append(card);
 }
 const mark=emblem(spec.kind);
 // Per-processor engraved bars decorate the static housing, not the signal.
 const ns=mark.namespaceURI;
 for(let i=0;i<4;i++){
  const line=document.createElementNS(ns,'path');
  const offset=9+i*12+(hardware.hash>>(i*5)&7);
  line.setAttribute('d','M'+(offset+102)+' 78v-'+(6+(hardware.hash>>(i*3)&15)));
  line.setAttribute('data-hardware-mark',String(i));
  mark.append(line);
 }
 head.append(mark,identity,readouts);
 panel.querySelector('.plugin-identity-banner')?.replaceWith(head);
 panels.set(panel,{definition,state,formatValue,spec,signature:null});paint(panel);return true;
}
function paint(panel){
 const entry=panels.get(panel),state=entry?.state();if(!entry||!state)return;
 const {definition,formatValue,spec}=entry,signature=JSON.stringify([state.enabled,...spec.focus.map(k=>state[k])]);
 if(signature===entry.signature)return;entry.signature=signature;
 panel.dataset.effectEnabled=String(state.enabled!==false);
 for(const key of spec.focus){
  const control=definition.controls.find(c=>c.key===key);
  const out=panel.querySelector('[data-effect-readout="'+key+'"]'),fill=panel.querySelector('[data-effect-fill="'+key+'"]');
  if(out)out.textContent=effectReadout(control,state[key],formatValue);
  if(fill)fill.style.width=(effectDialFraction(control,state[key])*100).toFixed(2)+'%';
 }
}
export function updateEffectFaces(root=document){root.querySelectorAll('[data-effect-face]').forEach(paint);}
