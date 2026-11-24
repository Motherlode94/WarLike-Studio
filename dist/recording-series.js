export function seriesTakes(value=1){const total=Number(value);if(![1,2,4].includes(total))throw Error('Série invalide : choisis 1, 2 ou 4 prises.');return total;}
// Advancing is permitted only after a complete, automatically ended take has
// been committed locally. Manual stops and errors never restart a microphone.
export function createRecordingSeries(total){
 total=seriesTakes(total);let current=1,saved=0,active=true;
 return {get state(){return {current,total,saved,active};},cancel(){active=false;},advance({persisted=false,complete=false,automatic=false}={}){
  if(!active)return false;if(persisted)saved++;
  if(!persisted||!complete||!automatic||current>=total){active=false;return false;}
  current++;return true;
 }};
}
