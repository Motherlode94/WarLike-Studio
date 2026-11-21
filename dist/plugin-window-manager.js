// Session-local window lifecycle; DSP remains owned by the project.
export class PluginWindowManager {
  #windows = new Map();
  #active = null;
  open(instance, create) {
    if (!instance || typeof instance.key !== 'string') throw new TypeError('Invalid plugin instance');
    const existing = this.#windows.get(instance.key);
    if (existing) {
      if (existing.instance !== instance) throw new Error('Stale plugin identity');
      this.focus(instance);
      return existing;
    }
    const entry = Object.freeze({instance, view: create(instance)});
    this.#windows.set(instance.key, entry);
    this.focus(instance);
    return entry;
  }
  focus(instance) {
    const entry = this.#windows.get(instance?.key);
    if (!entry || entry.instance !== instance) return false;
    this.#windows.delete(instance.key);
    this.#windows.set(instance.key, entry);
    this.#active = instance;
    return true;
  }
  close(instance, dispose = () => {}) {
    const entry = this.#windows.get(instance?.key);
    if (!entry || entry.instance !== instance) return false;
    this.#windows.delete(instance.key);
    if (this.#active === instance) this.#active = this.entries.at(-1)?.instance ?? null;
    dispose(entry.view);
    return true;
  }
  clear(dispose = () => {}) {
    const entries = this.entries;
    this.#windows.clear();
    this.#active = null;
    const failures = [];
    for (const entry of entries) {
      try { dispose(entry.view); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, 'Plugin window disposal failed');
  }
  get active() { return this.#active; }
  get entries() { return [...this.#windows.values()]; }
  get size() { return this.#windows.size; }
}
