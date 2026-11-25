import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const page=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
test('Studio has dedicated dark favicon and keeps its music branding',()=>{
 assert.match(page,/<title>Warlike Studio — Crée ta fréquence\.<\/title>/);
 assert.match(page,/rel="icon"[^>]*href="\.\/favicon\.png\?v=20261125-dark"/);
 const icon=readFileSync(new URL('../dist/favicon.png',import.meta.url));
 assert.equal(icon.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.ok(statSync(new URL('../dist/favicon.png',import.meta.url)).size>500);
});
