import {instrumentFace,planInstrumentBanks,instrumentReadout,instrumentHardwareIdentity,instrumentPerformanceDeck} from './instrument-face-model.js';
const active=new WeakMap();
const ns='http://www.w3.org/2000/svg';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
// Original vector emblems identify the instrument family. These are decorative
// drawings, never animated as if they were signal measurements.
function emblem(kind){
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 220 100');svg.setAttribute('aria-hidden','true');
 const path=d=>{const n=document.createElementNS(ns,'path');n.setAttribute('d',d);svg.append(n);};
 if(kind==='harp'){path('M42 16Q115 5 174 28L48 88Z M42 16L48 88H181');for(let i=0;i<8;i++)path('M'+(57+i*14)+' '+(17+i*1.8)+'V'+(81-i*6.3));}
 else if(kind==='wind'){path('M24 43H194V58H24Z M20 38H42V64H20 M176 36V64');for(let i=0;i<6;i++)path('M'+(62+i*18)+' 43V58');}
 else if(kind==='brass'){path('M27 45H117Q146 45 177 19V81Q146 55 117 55H27Z M69 45V28H111V45 M79 28V18 M94 28V18 M108 28V18');}
 else if(kind==='piano'||kind==='organ'){path('M24 24H196V82H24Z');for(let i=1;i<12;i++)path('M'+(24+i*14.3)+' 25V82');if(kind==='organ'){for(let i=0;i<6;i++)path('M'+(46+i*25)+' 8V20');}else for(const i of [1,2,4,5,6,8,9,11])path('M'+(20+i*14.3)+' 25V59H'+(27+i*14.3)+'V25');}
 else if(kind==='guitar'){path('M143 14L153 20L107 60Q130 92 92 91Q55 90 62 64Q63 51 80 53L140 13 M79 57Q87 67 98 70');for(let i=0;i<6;i++)path('M'+(142+i*.8)+' '+(17+i)+'L'+(81+i)+' 76');}
 else if(kind==='bow'){path('M67 18Q95 21 84 40Q72 50 88 62Q105 87 72 90Q43 87 56 65Q71 51 56 39Q46 20 67 18 M68 14V85 M103 88L165 14 M110 91L172 17');}
 else if(kind==='mallet'){for(let i=0;i<9;i++){const x=29+i*18,y=20+i*3;path('M'+x+' '+y+'H'+(x+12)+'V84H'+x+'Z');}path('M80 15L145 75 M126 13L67 72');}
 else if(kind==='pads'){for(let i=0;i<8;i++){const x=35+(i%4)*39,y=15+Math.floor(i/4)*39;path('M'+x+' '+y+'H'+(x+30)+'V'+(y+30)+'H'+x+'Z');}}
 else if(kind==='voice'){path('M37 77Q55 19 73 77Q95 7 114 77Q137 31 155 77Q174 48 192 77 M24 85H202');}
 else if(kind==='fm'){path('M26 31H74V64H26Z M145 31H193V64H145Z M74 47H145 M101 47V80H144 M50 64V80H101');}
 else if(kind==='layers'){path('M35 24H156V61H35Z M49 37H170V74H49Z M63 50H184V87H63Z');}
 else {path('M27 25H78V75H27Z M142 25H193V75H142Z M78 50H142 M106 35V65 M114 29V71');}
 return svg;
}
export function mountInstrumentFace(panel,{id,definition,state,formatValue}){
 const spec=instrumentFace(id);if(!spec||panel.dataset.instrumentFace)return false;
 const containers=[...panel.querySelectorAll('.plugin-window-params')];
 const native=containers.map(c=>[...c.querySelectorAll('.param')]);
 // EXO has native select controls outside its parameter containers.
 const selects=[...panel.querySelectorAll('[data-exo-control]')].map(n=>n.dataset.exoControl);
 const keys=native.map(nodes=>nodes.map(n=>n.querySelector('[data-param]')?.dataset.param?.replace(/^instrument\./,'')));
 const plan=spec.banks.length?planInstrumentBanks(id,[...keys,...(selects.length?[selects]:[])]):null;
 if(spec.banks.length&&!plan)return false;
 if(plan)for(let i=0;i<containers.length;i++){
  const byKey=new Map(keys[i].map((key,j)=>[key,native[i][j]]));
  containers[i].classList.add('instrument-control-banks');
  containers[i].replaceChildren(...plan[i].map((bank,index)=>{const group=el('section',null,'instrument-control-bank');group.dataset.instrumentBank=bank.name;group.append(el('h4',bank.name));for(const key of bank.keys){const control=byKey.get(key);control.dataset.instrumentKey=key;group.append(control);}if(!index)group.classList.add('instrument-primary-bank');return group;}));
 }
 const hardware=instrumentHardwareIdentity(id);
 panel.dataset.instrumentFace=id;panel.dataset.instrumentLayout=spec.layout;panel.dataset.instrumentMaterial=spec.material;
 panel.dataset.instrumentChassis=hardware.chassis;panel.dataset.instrumentVariant=hardware.variant;
 panel.style.setProperty('--instrument-accent',definition.color||'#a8c8bb');
 const heading=el('header',null,'instrument-face-heading');heading.append(emblem(spec.motif));
 const title=el('div',null,'instrument-face-title');title.append(el('small','WARLIKE / '+spec.family),el('h2',definition.name),el('p',definition.subtitle));
 const plate=el('div',null,'instrument-hardware-plate');plate.setAttribute('aria-label','Identité matérielle de '+definition.name);
 plate.append(el('strong',hardware.engraving),el('small','SERIES '+hardware.serial));
 const trim=el('span',null,'instrument-hardware-trim');trim.setAttribute('aria-hidden','true');
 for(let i=0;i<hardware.notches;i++)trim.append(el('i'));
 plate.append(trim);title.append(plate);heading.append(title);
 const readout=el('div',null,'instrument-config-readout');readout.setAttribute('aria-label','Paramètres configurés de '+definition.name);
 for(const key of spec.focus){const c=definition.controls.find(c=>c.key===key);if(!c)continue;const field=el('div');field.append(el('small',c.name));const value=el('output');value.dataset.instrumentReadout=key;field.append(value);readout.append(field);}
 heading.append(readout);panel.querySelector('.plugin-identity-banner')?.replaceWith(heading);
 // Move the TWO genuine native parameter nodes into a purpose-built performance
 // desk. DOM listeners, keyboard controls, automation and per-plugin undo survive.
 // Remaining controls stay in their existing banks; no DSP state is duplicated.
 const performance=instrumentPerformanceDeck(id,definition);
 if(performance){
  const available=new Map([...panel.querySelectorAll('.plugin-window-params .param')]
   .map(node=>[node.querySelector('[data-param]')?.dataset.param?.replace(/^instrument\./,''),node]));
  if(performance.keys.every(key=>available.has(key))){
   const deck=el('section',null,'instrument-performance-deck');
   deck.dataset.performanceType=performance.type;
   deck.setAttribute('aria-label',performance.title);
   const description=el('div',null,'instrument-performance-description');
   description.append(el('strong',performance.title),el('small',performance.hint));
   const controls=el('div',null,'instrument-performance-controls');
   for(const key of performance.keys){
    const original=available.get(key);
    original.dataset.performanceKey=key;
    controls.append(original);
   }
   deck.append(description,controls);
   heading.after(deck);
   panel.dataset.instrumentPerformance=performance.type;
   panel.querySelectorAll('.instrument-control-bank').forEach(bank=>{
    if(!bank.querySelector('.param'))bank.hidden=true;
   });
  }
 }
 active.set(panel,{id,state,definition,formatValue,keys:spec.focus,signature:''});paint(panel);return true;
}
function paint(panel){const entry=active.get(panel),state=entry?.state();if(!state)return;const values=entry.keys.map(k=>state[k]),signature=JSON.stringify(values);if(signature===entry.signature)return;entry.signature=signature;for(const key of entry.keys){const control=entry.definition.controls.find(c=>c.key===key),node=panel.querySelector('[data-instrument-readout="'+key+'"]');if(node&&control)node.textContent=instrumentReadout(entry.id,control,state[key]??control.default,entry.formatValue);}}
export function updateInstrumentFaces(root=document){root.querySelectorAll('[data-instrument-face]').forEach(paint);}
