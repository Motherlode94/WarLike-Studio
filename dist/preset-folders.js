// Folder labels never change a preset's identity, order in its bank or values.
const genres=new Map([
 ['TRAP','Trap'],['DRILL','Drill'],['AMAPIANO','Amapiano'],['AFROBEAT','Afrobeat'],
 ['R&B','R&B / Neo Soul'],['NEO SOUL','R&B / Neo Soul'],['FUNK','Funk'],['GOSPEL','Gospel'],
 ['ROCK','Rock alternatif'],['ALT ROCK','Rock alternatif'],['METAL','Metal'],
 ['AMBIENT','Ambient'],['CINEMATIC','Cinematic']
]);
export const PRESET_SOURCES={factory:'Usine',project:'Mes presets · projet',user:'Mes presets · cet appareil'};
export function presetFolder(name){
 const prefix=String(name).split('/')[0].trim().toUpperCase();
 return genres.get(prefix)||'Général';
}
export function presetFolderTree(entries,pathFor){
 const root={children:new Map(),entries:[],count:0};
 for(const entry of entries){
  let node=root;node.count++;
  for(const label of pathFor(entry)){
   if(!node.children.has(label))node.children.set(label,{children:new Map(),entries:[],count:0});
   node=node.children.get(label);node.count++;
  }
  node.entries.push(entry);
 }
 return root;
}
// Native disclosure controls support touch, Tab and Enter/Space. Search opens
// matching paths temporarily without overwriting the user's collapsed folders.
export function renderPresetFolders(root,entries,{pathFor,onChoose,disabled=()=>false,expanded=new Map(),searching=false}){
 root.replaceChildren();
 const tree=presetFolderTree(entries,pathFor);
 function append(parent,node,path=[]){
  for(const [label,child] of node.children){
   const names=[...path,label],key=JSON.stringify(names),folder=document.createElement('details');
   folder.dataset.presetFolder=key;folder.open=searching||(expanded.get(key)??path.length===0);
   const title=document.createElement('summary');title.textContent=label+' · '+child.count;
   title.onclick=event=>{event.preventDefault();folder.open=!folder.open;if(!searching)expanded.set(key,folder.open);};
   folder.append(title);append(folder,child,names);parent.append(folder);
   folder.addEventListener('toggle',()=>{if(folder.isConnected&&!searching)expanded.set(key,folder.open);});
  }
  for(const entry of node.entries){
   const button=document.createElement('button');button.type='button';button.className='preset-folder-choice';
   button.textContent=entry.preset.name;button.disabled=disabled(entry);button.dataset.presetSource=entry.preset.source;
   button.dataset.pickerPreset=entry.id;button.dataset.presetIndex=String(entry.preset.index);
   button.onclick=()=>onChoose(entry);parent.append(button);
  }
 }
 append(root,tree);
 if(!tree.count){const empty=document.createElement('p');empty.className='picker-empty';empty.textContent='Aucun preset trouvé.';root.append(empty);}
 return tree.count;
}
