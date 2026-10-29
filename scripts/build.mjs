import {readFile,readdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const files=(await readdir(dist,{recursive:true})).filter(f=>f.endsWith('.js'));
for(const file of files){
  const location=path.join(dist,file);execFileSync(process.execPath,['--check',location],{stdio:'inherit'});
  const text=await readFile(location,'utf8');
  for(const match of text.matchAll(/(?:from\s+|import\(|new URL\()['"](\.\/[^'"]+\.js(?:\?[^'"]*)?)['"]/g))await access(path.resolve(path.dirname(location),match[1].split('?')[0]));
}
const html=await readFile(path.join(dist,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"?]+)(?:\?[^\"]*)?"/g))await access(path.join(dist,match[1]));
const config=JSON.parse(await readFile(path.join(root,'wrangler.jsonc'),'utf8'));
if(config.name!=='warlike-studio'||config.pages_build_output_dir!=='./dist'||config.assets)throw new Error('Cloudflare Pages must deploy warlike-studio from dist/.');
const {ACOUSTIC_BANKS}=await import('../dist/acoustic-manifest.js');
let recordings=0;for(const bank of Object.values(ACOUSTIC_BANKS))for(const sample of bank.samples){const data=await readFile(path.join(dist,'samples',sample.file));if(data.length!==sample.bytes||data.length<2048)throw Error('Missing or incomplete recording: '+sample.file);recordings++;}
console.log(`Acoustic collection verified: ${Object.keys(ACOUSTIC_BANKS).length} banks, ${recordings} recordings.`);
console.log(`Ready for Cloudflare Pages: warlike-studio, dist/ verified, ${files.length} JavaScript modules checked.`);
