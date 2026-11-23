// Follow the visible disclosure path instead of clicking a hidden preset row.
// Keeps the existing suite assertions and real preset application unchanged.
export async function chooseFolderPreset(choice){
 for(const folder of await choice.locator('xpath=ancestor::details').all()){
  if(await folder.getAttribute('open')===null)await folder.locator(':scope > summary').click();
 }
 await choice.click();
}
