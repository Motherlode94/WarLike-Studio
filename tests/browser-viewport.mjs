// Studio debounces a full DOM rebuild after a viewport resize. Waiting for the
// viewport dimensions alone does not mean the controls are ready to inspect.
export async function resizeStudio(page,size){
 const before=page.viewportSize();
 if(before?.width!==size.width||before?.height!==size.height){
  const row=await page.locator('#trackRows .track-row').first().elementHandle();
  if(!row)throw Error('Cannot synchronize Studio resize without a loaded track');
  try{
   await page.setViewportSize(size);
   await page.waitForFunction(node=>!node.isConnected,row);
  }finally{await row.dispose();}
 }
 await page.evaluate(async()=>{
  await document.fonts.ready;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 });
}
