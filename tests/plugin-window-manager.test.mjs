import test from 'node:test';
import assert from 'node:assert/strict';
import {PluginInstances} from '../dist/plugin-instances.js';
import {PluginWindowManager} from '../dist/plugin-window-manager.js';

test('same effect on different tracks has independent views and focus order', () => {
  const ids = new PluginInstances(), windows = new PluginWindowManager();
  const a = ids.acquire('lead','glue'), b = ids.acquire('backing','glue');
  const first = windows.open(a, () => ({value: 1}));
  const second = windows.open(b, () => ({value: 2}));
  assert.notEqual(first.view, second.view);
  assert.equal(windows.active,b);
  assert.equal(windows.open(a, () => {throw Error('duplicate view');}),first);
  assert.deepEqual(windows.entries.map(e=>e.instance),[b,a]);
  const disposed = [];
  assert.equal(windows.close(a,v=>disposed.push(v)),true);
  assert.deepEqual(disposed,[first.view]);
  assert.equal(windows.active,b);
  assert.equal(windows.size,1);
  windows.clear(v=>disposed.push(v));
  assert.deepEqual(disposed,[first.view,second.view]);
  assert.equal(windows.active,null);
});
test('stale identity cannot focus or close a replacement window', () => {
  const ids = new PluginInstances(), windows = new PluginWindowManager();
  const old = ids.acquire('lead','glue');
  windows.open(old,()=>({}));
  windows.close(old); ids.release(old);
  const fresh = ids.acquire('lead','glue');
  windows.open(fresh,()=>({}));
  assert.equal(windows.focus(old),false);
  assert.equal(windows.close(old),false);
  assert.throws(()=>windows.open(old,()=>({})),/Stale/);
  assert.equal(windows.active,fresh);
});
test('failed creation does not register a window', () => {
  const windows = new PluginWindowManager(), a = new PluginInstances().acquire('a','glue');
  assert.throws(()=>windows.open(a,()=>{throw Error('failed');}));
  assert.equal(windows.size,0);
  assert.equal(windows.active,null);
});
