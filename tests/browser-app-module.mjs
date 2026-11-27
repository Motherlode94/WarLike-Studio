// Reuse the running application module, including its cache version. Importing
// another app.js URL would create a second application in the same document.
export async function launchLoadedPublicDemo(page,kind){
 return page.evaluate(async demoKind=>{
  const app=performance.getEntriesByType('resource').find(entry=>new URL(entry.name).pathname.endsWith('/app.js'));
  if(!app)throw Error('The running Studio application module was not observed.');
  const {launchPublicDemo}=await import(app.name);
  await launchPublicDemo(demoKind);
 },kind);
}
