import test from 'node:test';
import assert from 'node:assert/strict';
import {PluginInstances} from '../dist/plugin-instances.js';
test('identity is isolated by track and effect',()=>{
 const r=new PluginInstances(),a=r.acquire('voice','glue');
 assert.equal(r.acquire('voice','glue'),a);
 assert.notEqual(r.acquire('bus','glue'),a);
 assert.notEqual(r.acquire('voice','prism'),a);
 assert.equal(r.size,3);
 r.release(a);const next=r.acquire('voice','glue');assert.notEqual(next,a);
 r.release(a);assert.equal(r.size,3);
 r.clear();assert.equal(r.size,0);
});
test('tuple keys avoid delimiter collisions',()=>{
 const r=new PluginInstances();assert.notEqual(r.acquire('a:b','c'),r.acquire('a','b:c'));
});
