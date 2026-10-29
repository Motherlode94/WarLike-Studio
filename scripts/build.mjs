import {readFile,readdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const files=(await readdir(dist)).filter(f=>f.endsWith('.js'));
for(const file of files){
  const location=path.join(dist,file);execFileSync(process.execPath,['--check',location],{stdio:'inherit'});
  const text=await readFile(location,'utf8');
  for(const match of text.matchAll(/(?:from\s+|import\(|new URL\()['"](\.\/[^'"]+\.js(?:\?[^'"]*)?)['"]/g))await access(path.resolve(dist,match[1].split('?')[0]));
}
const html=await readFile(path.join(dist,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\.\/[^"?]+)(?:\?[^\"]*)?"/g))await access(path.join(dist,match[1]));
const config=JSON.parse(await readFile(path.join(root,'wrangler.jsonc'),'utf8'));
if(config.name!=='warlike-studio'||config.pages_build_output_dir!=='./dist'||config.assets)throw new Error('Cloudflare Pages must deploy warlike-studio from dist/.');
console.log(`Ready for Cloudflare Pages: warlike-studio, dist/ verified, ${files.length} JavaScript modules checked.`);
