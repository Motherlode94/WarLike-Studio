/**
 * WarLike Studio cloud project API transport.
 * This module deliberately DOES NOT create accounts or trust a client-provided owner ID.
 * It is inert until a verified WarLike Server backend exposes these routes.
 */
export class StudioCloudError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'StudioCloudError';
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code) => {
  if (status === 401) return new StudioCloudError('Connexion WarLike requise.', status, code);
  if (status === 403) return new StudioCloudError('Accès au projet refusé.', status, code);
  if (status === 409) return new StudioCloudError('Conflit de révision : recharge ou conserve une copie locale avant de fusionner.', status, code);
  return new StudioCloudError('Service de synchronisation indisponible (' + status + ').', status, code);
};
function projectId(id) {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new TypeError('Identifiant de projet invalide.');
  return encodeURIComponent(id);
}
export class StudioCloudClient {
  #base;
  #fetch;
  constructor({ baseUrl, fetchImpl = fetch } = {}) {
    if (typeof baseUrl !== 'string' || !/^https:\/\//.test(baseUrl)) throw new TypeError('Une API HTTPS authentifiée est requise.');
    const url = new URL(baseUrl);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || url.port || url.hostname.endsWith('.')) throw new TypeError('Adresse API invalide.');
    this.#base = url.origin;
    this.#fetch = fetchImpl;
  }
  async #request(path, { method = 'GET', payload, signal } = {}) {
    const options = { method, mode:'cors', credentials:'include', cache:'no-store', headers:{Accept:'application/json'}, signal };
    if (payload !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(payload);
    }
    let response;
    try { response = await this.#fetch(this.#base + path, options); }
    catch (cause) {
      if (signal?.aborted) throw cause;
      throw new StudioCloudError('Réseau indisponible : sauvegarde locale conservée.', 0, 'NETWORK');
    }
    if (!response.ok) {
      let code;
      try { const errorBody = await response.json(); if (errorBody && typeof errorBody === 'object' && !Array.isArray(errorBody) && typeof errorBody.code === 'string') code = errorBody.code; } catch {}
      throw fail(response.status, code);
    }
    if (response.status === 204) return null;
    let value;
    try { value = await response.json(); }
    catch { throw new StudioCloudError('Réponse serveur illisible.', 502, 'INVALID_RESPONSE'); }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new StudioCloudError('Réponse serveur invalide.', 502, 'INVALID_RESPONSE');
    return value;
  }
  async identity({ signal } = {}) {
    const value = await this.#request('/api/studio/me', { signal });
    if (typeof value.userId !== 'string' || !value.userId || value.studioAccess !== true) {
      throw new StudioCloudError('Identité WarLike non vérifiée.', 403, 'NO_ACCESS');
    }
    return value;
  }
  async listProjects({ signal } = {}) {
    const value = await this.#request('/api/studio/projects', { signal });
    if (!Array.isArray(value.projects)) throw new StudioCloudError('Liste des projets invalide.', 502, 'INVALID_RESPONSE');
    return value.projects;
  }
  async createProject(project, { signal } = {}) {
    return this.#request('/api/studio/projects', {method:'POST', payload:{project}, signal});
  }
  async getProject(id, { signal } = {}) {
    return this.#request('/api/studio/projects/' + projectId(id), {signal});
  }
  async saveProject(id, project, revision, { signal } = {}) {
    if (!Number.isSafeInteger(revision) || revision < 1) throw new TypeError('Révision attendue obligatoire.');
    return this.#request('/api/studio/projects/' + projectId(id), {method:'PUT', payload:{project,expectedRevision:revision},signal});
  }
  async deleteProject(id, revision, { signal } = {}) {
    if (!Number.isSafeInteger(revision) || revision < 1) throw new TypeError('Révision attendue obligatoire.');
    return this.#request('/api/studio/projects/' + projectId(id), {method:'DELETE',payload:{expectedRevision:revision},signal});
  }
  async uploadAsset(project, file, { signal } = {}) {
    if (!(file instanceof Blob) || !file.size || file.size > 12 * 1024 * 1024) throw new TypeError('Fichier audio limité à 12 Mo.');
    const data = new FormData();
    data.append('file',file,typeof file.name==='string'?file.name:'studio-audio.wav');
    let response;
    try {
      response=await this.#fetch(this.#base+'/api/studio/projects/'+projectId(project)+'/assets',{
        method:'POST',mode:'cors',credentials:'include',cache:'no-store',body:data,signal,headers:{Accept:'application/json'}
      });
    } catch (cause) {
      if(signal?.aborted)throw cause;
      throw new StudioCloudError('Envoi audio interrompu : copie locale conservée.',0,'NETWORK');
    }
    if(!response.ok)throw fail(response.status);
    let asset;
    try { asset=await response.json(); }
    catch { throw new StudioCloudError('Réponse d’envoi audio invalide.',502,'INVALID_RESPONSE'); }
    if(!asset||typeof asset!=='object'||Array.isArray(asset)||typeof asset.id!=='string'||!asset.id)throw new StudioCloudError('Confirmation audio invalide.',502,'INVALID_RESPONSE');
    return asset;
  }
  async downloadAsset(project,assetId,{signal}={}){
    let response;
    try {
      response=await this.#fetch(this.#base+'/api/studio/projects/'+projectId(project)+'/assets/'+projectId(assetId),{
        method:'GET',mode:'cors',credentials:'include',cache:'no-store',signal
      });
    } catch(cause) {
      if(signal?.aborted)throw cause;
      throw new StudioCloudError('Téléchargement audio interrompu.',0,'NETWORK');
    }
    if(!response.ok)throw fail(response.status);
    return response.arrayBuffer();
  }

}
