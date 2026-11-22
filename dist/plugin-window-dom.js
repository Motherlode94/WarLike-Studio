// Control lookup stays local even when another plugin owns the legacy active IDs.
export function findPluginControl(root,name){
  return root.querySelector(`[data-plugin-control="${name}"], [id="${name}"]`);
}
export function scopePluginWindowIds(root,prefix,active){
  const aliases=new Map();
  for(const node of root.querySelectorAll('[id]')){
    const name=node.dataset.pluginControl||node.id,next=active?name:prefix+'-'+name;
    node.dataset.pluginControl=name;aliases.set(node.id,next);aliases.set(name,next);
    if(node.id!==next)node.id=next;
  }
  for(const node of [root,...root.querySelectorAll('[for],[aria-labelledby],[aria-describedby]')]){
    for(const attribute of ['for','aria-labelledby','aria-describedby']){
      const value=node.getAttribute(attribute);if(!value)continue;
      const next=value.split(' ').map(id=>aliases.get(id)||id).join(' ');if(value!==next)node.setAttribute(attribute,next);
    }
  }
}
