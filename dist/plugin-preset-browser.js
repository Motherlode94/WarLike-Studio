import {findPluginControl} from './plugin-window-dom.js';
import {PRESET_SOURCES,presetFolder,renderPresetFolders} from './preset-folders.js';
const views=new WeakMap();
const normal=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');

export function groupFactoryPresetOptions(select){
 const selected=select.value;
 const groups=new Map();
 for(const option of [...select.options]){
  if(Number(option.value)<0)continue;
  const label=presetFolder(option.textContent);
  if(!groups.has(label)){const group=document.createElement('optgroup');group.label=label;groups.set(label,group);}
  groups.get(label).append(option);
 }
 select.append(...groups.values());
 select.value=selected;
}

export function mountPluginPresetBrowser({root,bar,panel}){
 const state=views.get(root)||{open:false,query:'',source:'all',expanded:new Map()};views.set(root,state);
 const entries=[];
 for(const [source,name] of [['factory','suitePreset'],['project','personalEffectPreset'],['user','userPluginPreset']]){
  const select=findPluginControl(panel,name)||findPluginControl(bar,name);if(!select)continue;
  for(const option of [...select.options]){
   if(option.value===''||Number(option.value)<0)continue;
   entries.push({id:source,preset:{name:option.textContent,index:option.value,source},select});
  }
 }
 const browser=document.createElement('details');browser.className='plugin-preset-browser';browser.open=state.open;
 const title=document.createElement('summary');title.textContent='Parcourir les presets';
 const tools=document.createElement('div');tools.className='preset-browser-tools';
 const search=document.createElement('input');search.type='search';search.placeholder='Rechercher un preset…';search.setAttribute('aria-label','Rechercher les presets de ce plugin');search.value=state.query;
 const source=document.createElement('select');source.setAttribute('aria-label','Source des presets de ce plugin');
 source.add(new Option('Toutes les sources','all'));
 for(const [id,label] of Object.entries(PRESET_SOURCES))source.add(new Option(label,id));source.value=state.source;
 const count=document.createElement('output');count.setAttribute('role','status');
 const results=document.createElement('div');results.className='preset-folder-results';
 tools.append(search,source);browser.append(title,tools,count,results);bar.append(browser);
 const render=()=>{
  const words=normal(state.query).trim().split(/\s+/).filter(Boolean);
  const filtered=entries.filter(e=>(state.source==='all'||e.preset.source===state.source)&&words.every(w=>normal(e.preset.name+' '+presetFolder(e.preset.name)+' '+PRESET_SOURCES[e.preset.source]).includes(w)));
  count.textContent=filtered.length+' / '+entries.length+' presets';
  renderPresetFolders(results,filtered,{expanded:state.expanded,searching:words.length>0,
   pathFor:e=>[PRESET_SOURCES[e.preset.source],presetFolder(e.preset.name)],
   onChoose:entry=>{state.open=false;entry.select.value=entry.preset.index;entry.select.dispatchEvent(new Event('change',{bubbles:true}));}
  });
 };
 search.oninput=()=>{state.query=search.value;render();};source.onchange=()=>{state.source=source.value;render();};
 browser.addEventListener('toggle',()=>{if(browser.isConnected)state.open=browser.open;});
 browser.addEventListener('keydown',event=>{if(event.key==='Escape'&&browser.open){browser.open=false;state.open=false;title.focus();event.preventDefault();event.stopPropagation();}});
 render();
}
