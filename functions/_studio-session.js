// Studio's same-origin facade. The bearer never leaves the service binding.
export const COOKIE='__Host-warlike-studio';
export const ACCOUNT_HEADER='X-Warlike-Studio-Account';
export const validAccount=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value);
export function getToken(request){
 const values=(request.headers.get('Cookie')||'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(COOKIE+'='));
 const token=values.length===1?values[0].slice(COOKIE.length+1):'';
 return /^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
export const sessionCookie=(token,maxAge=28800)=>COOKIE+'='+token+'; Path=/; Max-Age='+maxAge+'; Secure; HttpOnly; SameSite=Strict';
export const noSessionCookie=()=>COOKIE+'=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict';
export function guardOrigin(request){
 const url=new URL(request.url);
 return url.protocol==='https:'&&request.headers.get('Origin')===url.origin&&request.headers.get('Sec-Fetch-Site')!=='cross-site';
}
export class StudioRequestError extends Error{constructor(message,status){super(message);this.status=status}}
export async function readLimitedBody(request,limit){
 const length=request.headers.get('Content-Length'),encoding=request.headers.get('Content-Encoding');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>limit))throw new StudioRequestError('Requête trop volumineuse.',413);
 if(encoding&&encoding!=='identity')throw new StudioRequestError('Compression non prise en charge.',415);
 if(!request.body)return new Uint8Array();
 const reader=request.body.getReader(),parts=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){void reader.cancel().catch(()=>{});throw new StudioRequestError('Requête trop volumineuse.',413)}parts.push(value)}}finally{reader.releaseLock()}
 const body=new Uint8Array(size);let offset=0;for(const part of parts){body.set(part,offset);offset+=part.byteLength}return body;
}
export async function forwardServer(context,path,{method,headers,body}={}){
 if(!context.env.WARLIKE_APP)return privateJson({error:'Service WarLike indisponible'},503);
 const h=new Headers(headers||{});
 // The facade has already checked the browser origin. The internal request has
 // its own canonical origin; Server also checks it on project/media writes.
 if(!['GET','HEAD'].includes(method||'GET'))h.set('Origin','https://warlike-server.pages.dev');
 h.delete('Cookie');h.delete('Host');h.delete('X-Warlike-Identity');h.delete('X-Warlike-Signature');
 return context.env.WARLIKE_APP.fetch(new Request('https://warlike-server.pages.dev'+path,{method:method||'GET',headers:h,body,redirect:'manual'}));
}
export function secureHeaders(response){
 const headers=new Headers(response.headers);
 headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','no-referrer');headers.set('X-Robots-Tag','noindex, nofollow');
 headers.delete('Set-Cookie');headers.delete('Access-Control-Allow-Origin');return headers;
}
export function privateJson(data,status=200,extra={}){return Response.json(data,{status,headers:{...Object.fromEntries(secureHeaders(new Response())),...extra}})}
