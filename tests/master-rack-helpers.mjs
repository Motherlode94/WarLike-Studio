// The Master rack opens one processor window at a time, like track inserts.
export async function selectMasterModule(page,id){
 const editor=page.locator('[data-managed-window="plugin:master-rack-module"]');
 if(await editor.isVisible())await editor.locator('header [data-float-close]').click();
 await page.locator('#masteringView .master-insert-rack [data-insert-open="'+id+'"]').click();
 await editor.waitFor({state:'visible'});
}
export async function closeMasterRack(page){
 const editor=page.locator('[data-managed-window="plugin:master-rack-module"]');if(await editor.isVisible())await editor.locator('header [data-float-close]').click();
 const rack=page.locator('[data-managed-window="plugin:master-rack"]');
 if(await rack.isVisible())await rack.locator(':scope>header [data-float-close]').click();
}
