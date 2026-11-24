import {recordingRange,recordingWindow} from './recording-range.js';
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export function mountRecordingRange(root,project,positionBar,busy=false){
 const saved=recordingRange(project.recording?.range),sections=(project.sections||[]).filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.length)&&s.length>0&&s.start>=0&&s.start+s.length<=project.bars);
 const section=sections.find(s=>positionBar>=s.start&&positionBar<s.start+s.length),fallback=Math.max(0,Math.min(project.bars-1,Math.floor(positionBar)));
 const initial=saved||{enabled:false,start:section?.start??fallback,end:section?section.start+section.length:Math.min(project.bars,fallback+4)};
 const field=node('fieldset');field.className='recording-range-settings';field.disabled=busy;field.append(node('legend','Plage de prise'));
 const toggle=node('input');toggle.type='checkbox';toggle.id='recordRangeEnabled';toggle.checked=initial.enabled;
 const label=node('label');label.className='workflow-check';label.append(toggle,document.createTextNode(' Enregistrer uniquement la plage choisie'));field.append(label);
 const selectLabel=node('label','Section du morceau'),select=node('select');select.id='recordRangeSection';
 const custom=node('option','Personnalisée');custom.value='custom';select.append(custom);
 for(const [i,s] of sections.entries()){const option=node('option',s.name);option.value=String(i);select.append(option);}
 selectLabel.append(select);field.append(selectLabel);
 const controls=node('div');controls.className='workflow-grid';
 const startLabel=node('label','Début · mesure'),endLabel=node('label','Arrêt · début de la mesure');
 const start=node('input'),end=node('input');start.id='recordRangeStart';end.id='recordRangeEnd';
 for(const input of [start,end]){input.type='number';input.min='1';input.max=String(project.bars+1);input.step='0.0625';}
 start.value=String(initial.start+1);end.value=String(initial.end+1);startLabel.append(start);endLabel.append(end);controls.append(startLabel,endLabel);field.append(controls);
 const preRollLabel=node('label','Prélecture du morceau avant la prise'),preRoll=node('select');preRoll.id='recordPreRoll';
 for(const bars of [0,1,2,4]){const option=node('option',bars?bars+' mesure'+(bars>1?'s':''):'Aucune');option.value=String(bars);preRoll.append(option);}preRoll.value=String(initial.preRollBars||0);preRollLabel.append(preRoll);field.append(preRollLabel);
 const description=node('p','Écoute le morceau avant la plage ; seule la plage choisie est enregistrée. La prélecture est raccourcie au début du morceau. Le décompte la précède et les autres prises restent conservées.');field.append(description);
 function refresh(){for(const input of [select,start,end,preRoll])input.disabled=!toggle.checked;}
 function match(){const found=sections.findIndex(s=>s.start===Number(start.value)-1&&s.start+s.length===Number(end.value)-1);select.value=found<0?'custom':String(found);}
 select.onchange=()=>{const s=sections[Number(select.value)];if(select.value==='custom'||!s)return;start.value=String(s.start+1);end.value=String(s.start+s.length+1);};
 start.oninput=end.oninput=match;toggle.onchange=refresh;match();refresh();const anchor=root.querySelector('#workflowCountIn')?.closest('label');if(anchor)anchor.after(field);else root.append(field);
 return {read(){const range=recordingRange({enabled:toggle.checked,start:Number(start.value)-1,end:Number(end.value)-1,preRollBars:Number(preRoll.value)});recordingWindow(range,project);return range;}};
}
export function recordingRangeIndicator({getRange,busy,open}){
 const parent=document.getElementById('recordCountIn')?.closest('.record-count-in');if(!parent)return ()=>{};
 const button=node('button');button.type='button';button.id='recordRangeIndicator';button.className='record-range-indicator';button.onclick=open;button.hidden=true;
 parent.append(button);
 return ()=>{const range=getRange(),label=range?.enabled?'Plage '+(range.start+1)+' → '+(range.end+1):'';button.hidden=!label;button.disabled=!!busy();if(button.textContent!==label){button.textContent=label;button.setAttribute('aria-label',label+' · régler la plage de prise');}};
}
