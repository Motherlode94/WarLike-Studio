import {pluginBundle,pluginCategory,pluginSearchText} from './plugin-picker.js?v=0.15.11';
import {PRESET_SOURCES,presetFolder} from './preset-folders.js';
const normal=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
export const sidebarPath=(id,def)=>[pluginBundle(id,def),pluginCategory(id,def)];
export const sidebarMatches=(query,...values)=>normal(query).trim().split(/\s+/).filter(Boolean).every(word=>normal(values.join(' ')).includes(word));
// Move the original instrument/effect buttons so their delegated actions remain
// intact. Preset selection is explicit and routed through Studio's undo model.
export function mountSidebarBrowser({instruments,effects,readPresets,onPreset,revision=()=>null}){
 const folders=[],records=[],expanded=new Map(),search=document.getElementById('librarySearch');let searching=false,lastRevision;
 const status=document.createElement('output');status.className='sidebar-browser-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');search.closest('label').after(status);
 function folder(parent,label,path,open=true){const node=document.createElement('details'),title=document.createElement('summary');node.className='sidebar-folder';node.dataset.browserFolder=JSON.stringify(path);node.open=open;title.textContent=label;node.append(title);parent.append(node);folders.push(node);node.addEventListener('toggle',()=>{if(!searching)expanded.set(node.dataset.browserFolder,node.open);});return node;}
 for(const [kind,registry,root] of [['instrument',instruments,document.getElementById('libraryInstruments')],['effect',effects,document.getElementById('libraryEffects')]]){
  const groups=new Map();
  for(const [id,def] of Object.entries(registry)){
   const button=root.querySelector(kind==='instrument'?`[data-instrument="${id}"]`:`[data-open-fx="${id}"]`);if(!button)continue;
   let parent=root,path=[kind];
   for(const label of sidebarPath(id,def)){path=[...path,label];const key=JSON.stringify(path);if(!groups.has(key))groups.set(key,folder(parent,label,path));parent=groups.get(key);}
   const entry=document.createElement('div');entry.className='sidebar-plugin';entry.dataset.browserPlugin=id;parent.append(entry);entry.append(button);
   const presets=folder(entry,'Presets',[...path,id,'presets'],false);presets.dataset.browserPresets=id;
   const record={kind,id,def,entry,presets,queryText:pluginSearchText(id,def)};records.push(record);
   presets.addEventListener('toggle',()=>{if(presets.open&&!searching)renderPresets(record,'');});
  }
 }
 function renderPresets(record,query){
  const {presets,kind,id,def}=record;presets.querySelectorAll(':scope > :not(summary)').forEach(n=>n.remove());
  const entries=readPresets(kind,id),sources=new Map(),groups=new Map();let matches=0;
  for(const preset of entries){if(!sidebarMatches(query,record.queryText,preset.name,PRESET_SOURCES[preset.source],presetFolder(preset.name)))continue;matches++;
   const sourceLabel=PRESET_SOURCES[preset.source]||preset.source;
   if(!sources.has(sourceLabel)){const source=document.createElement('details');source.open=true;source.dataset.browserSource=preset.source;const title=document.createElement('summary');title.textContent=sourceLabel;source.append(title);presets.append(source);sources.set(sourceLabel,source);}
   const groupLabel=presetFolder(preset.name),key=sourceLabel+'/'+groupLabel;
   if(!groups.has(key)){const group=document.createElement('details');group.open=!!query;const title=document.createElement('summary');title.textContent=groupLabel;group.append(title);sources.get(sourceLabel).append(group);groups.set(key,group);}
   const button=document.createElement('button');button.type='button';button.className='sidebar-preset';button.textContent=preset.name;button.dataset.sidebarPreset=id;button.dataset.presetSource=preset.source;button.title='Appliquer '+preset.name;button.onclick=event=>{event.stopPropagation();onPreset(kind,id,preset);};groups.get(key).append(button);
  }
  presets.querySelector(':scope > summary').textContent='Presets · '+entries.length;
  if(!matches){const empty=document.createElement('small');empty.textContent='Aucun preset trouvé.';presets.append(empty);}
  return matches;
 }
 function filter(){
  const query=search.value.trim(),wasSearching=searching;lastRevision=revision();
  if(query&&!searching)for(const node of folders)expanded.set(node.dataset.browserFolder,node.open);
  searching=!!query;let count=0;
  for(const record of records){let matches=sidebarMatches(query,record.queryText);
   if(query){const presets=renderPresets(record,query);matches||=presets>0;record.presets.hidden=!presets;record.presets.open=presets>0;}
   else{record.presets.hidden=false;record.presets.open=expanded.get(record.presets.dataset.browserFolder)??false;if(record.presets.open)renderPresets(record,'');}
   record.entry.hidden=!matches;if(matches)count++;
  }
  for(const node of [...folders].reverse()){
   if(node.dataset.browserPresets)continue;
   node.hidden=![...node.querySelectorAll('.sidebar-plugin')].some(entry=>!entry.hidden);
   if(query&&!node.hidden)node.open=true;else if(!query)node.open=expanded.get(node.dataset.browserFolder)??true;
  }
  document.querySelectorAll('.sample-row,.tune-library').forEach(node=>node.hidden=!sidebarMatches(query,node.textContent));
  // A search must not be hidden behind a previously folded instrument/effect section.
  for(const section of document.querySelectorAll('.library-section')){if(query){if(!wasSearching)section.dataset.beforeSearchCollapsed=String(section.classList.contains('fl-folder-collapsed'));section.classList.remove('fl-folder-collapsed');}else if(wasSearching){section.classList.toggle('fl-folder-collapsed',section.dataset.beforeSearchCollapsed==='true');}const toggle=section.querySelector('.fl-folder-toggle');if(toggle){const collapsed=section.classList.contains('fl-folder-collapsed');toggle.setAttribute('aria-expanded',String(!collapsed));toggle.textContent=collapsed?'▸':'▾';}}
  status.textContent=query?count+' module(s) correspondant(s)':'Collections · familles · presets';
 }
 search.oninput=filter;
 search.addEventListener('keydown',event=>{if(event.key==='Escape'&&search.value){search.value='';filter();event.preventDefault();event.stopPropagation();}});
 document.addEventListener('warlike-sidebar-refresh',()=>{if(search.value)filter();else for(const record of records)if(record.presets.open)renderPresets(record,'');});
 filter();return {refresh:()=>{if(lastRevision!==revision())filter();}};
}
