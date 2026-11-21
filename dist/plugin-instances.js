// Session-local identity registry. No DSP state is copied or persisted here.
export class PluginInstances {
  #entries=new Map();
  acquire(trackId,id){
    const key=JSON.stringify([trackId,id]);
    if(!this.#entries.has(key))this.#entries.set(key,Object.freeze({key,trackId,id}));
    return this.#entries.get(key);
  }
  release(instance){if(instance&&this.#entries.get(instance.key)===instance)this.#entries.delete(instance.key);}
  clear(){this.#entries.clear();}
  get size(){return this.#entries.size;}
}
