// Cloudflare Pages Functions: Studio's private same-origin backend facade.
// Requires WARLIKE_APP service binding to the authenticated WarLike Server runtime.
export const COOKIE='__Host-warlike-studio';
export function getToken(request){
 const cookie=request.headers.get('Cookie')||'';
 const match=cookie.match(/(?:^|;\s*)__Host-warlike-studio=([A-Za-z0-9_-]{43})(?:;|$)/);
 return match?.[1]||null;
}
export const sessionCookie=(token,maxAge=28800)=>COOKIE+'='+token+'; Path=/; Max-Age='+maxAge+'; Secure; HttpOnly; SameSite=Strict';
export const noSessionCookie=()=>COOKIE+'=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict';
export function guardOrigin(request){
 const url=new URL(request.url);
 return request.headers.get('Origin')===url.origin && request.headers.get('Sec-Fetch-Site')!=='cross-site';
}
export async function forwardServer(context,path,{method,headers,body}={}){
 if(!context.env.WARLIKE_APP)return Response.json({error:'Service WarLike indisponible'},{status:503,headers:{'Cache-Control':'no-store'}});
 const url=new URL('https://warlike-server.pages.dev'+path);
 const h=new Headers(headers||{});
 h.delete('Cookie');h.delete('Host');h.delete('X-Warlike-Identity');h.delete('X-Warlike-Signature');
 const request=new Request(url.toString(),{method:method||'GET',headers:h,body,redirect:'manual'});
 return context.env.WARLIKE_APP.fetch(request);
}
export function secureHeaders(response){
 const headers=new Headers(response.headers);
 headers.set('Cache-Control','private, no-store');
 headers.set('X-Content-Type-Options','nosniff');
 headers.delete('Set-Cookie');
 headers.delete('Access-Control-Allow-Origin');
 return headers;
}
