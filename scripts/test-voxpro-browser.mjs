import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'../dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(content);}
 catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const port=server.address().port;
 await page.goto('http://127.0.0.1:'+port+'/voxpro-browser-test.html?autorun',{waitUntil:'load'});
 await page.locator('html[data-status]').waitFor({timeout:30000});
 const results=await page.locator('#results tr').evaluateAll(rows=>rows.map(row=>({status:row.cells[0].textContent,test:row.cells[1].textContent,detail:row.cells[2].textContent})));
 for(const row of results)console.log(row.status+' '+row.test+' — '+row.detail);
 console.log('Summary:',await page.locator('#summary').textContent());
 assert.equal(errors.length,0,'Browser page errors: '+errors.join('; '));
 assert.ok(results.length>=9,'Missing browser-rendered assertions');
 assert.ok(results.every(r=>r.status==='PASS'),'One or more browser DSP assertions failed');
}finally{
 await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
