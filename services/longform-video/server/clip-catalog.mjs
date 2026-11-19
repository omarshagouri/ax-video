// Resolve catalog footage from its human-facing Visual_id (or exact filename).
// The catalog, not this renderer, owns the clip identity, Drive ID, and durations.
// An explicit file_id passed by the Visual Agent avoids requiring the Cloud Run
// service account to have Sheets permission; the Drive asset itself must remain readable.
const CATALOG_ID = process.env.AXLF_VISUAL_CATALOG_SHEET_ID || "1n_BoKTFc1EUIVjNPU5hRhGo2FJ3uZfVqoTf2CPjhf78";
const DRIVE_ID = /^[A-Za-z0-9_-]{12,}$/;
export const CLIP_ID = /^VV-LF-\d{3,}$/;

export function parseClipCatalog(values) {
  if (!Array.isArray(values) || !values.length) throw new Error("Clips catalog is empty");
  const headers = values[0].map(x=>String(x||"").trim().toLowerCase().replace(/[^a-z0-9]/g,""));
  const at = (name) => headers.indexOf(name.toLowerCase().replace(/[^a-z0-9]/g,""));
  for(const k of ["Clip_name","File_ID","Visual_id","Status","Duration_sec"]) {
    if(at(k)<0)throw new Error("Clips catalog missing column "+k);
  }
  const byId = new Map(), byFilename = new Map();
  for(const row of values.slice(1)) {
    const id=String(row[at("Visual_id")]||"").trim();
    if(!id)continue;
    if(!CLIP_ID.test(id))throw new Error("Invalid Clips Visual_id: "+id);
    const name=String(row[at("Clip_name")]||"").trim();
    const fileId=String(row[at("File_ID")]||"").trim();
    const status=String(row[at("Status")]||"").trim();
    const duration=Number(row[at("Duration_sec")]);
    if(byId.has(id)||byFilename.has(name.toLowerCase()))throw new Error("Duplicate Clips catalog id/name: "+id);
    const item={id,name,fileId,status,duration};
    byId.set(id,item);byFilename.set(name.toLowerCase(),item);
  }
  return {byId,byFilename};
}

export async function readLiveClipCatalog(client) {
  const range=encodeURIComponent("Clips!A:Z");
  const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(CATALOG_ID)}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`;
  try {
    const response=await client.request({url});
    return parseClipCatalog(response.data?.values);
  } catch (e) {
    throw new Error("Unable to read LIVE Clips sheet using Cloud Run identity. Either share catalog with renderer service account or set beat values.file_id from catalog: "+String(e?.message||e));
  }
}

export function selectClip(catalog, requested) {
  const key=String(requested||"").trim();
  const item=catalog.byId.get(key) || catalog.byFilename.get(key.toLowerCase());
  if(!item)throw new Error("Clip absent from LIVE Clips catalog: "+key);
  if(item.status.toLowerCase()!=="ready")throw new Error("Clip is not Ready: "+item.id);
  if(!DRIVE_ID.test(item.fileId))throw new Error("Clip missing/invalid File_ID: "+item.id);
  if(!(item.duration>0))throw new Error("Clip missing/invalid Duration_sec: "+item.id);
  return item;
}

export function resolveExplicitClip(requested, values={}) {
  const fileId=String(values.file_id||values.fileId||"").trim();
  if(!fileId)return null;
  if(!DRIVE_ID.test(fileId))throw new Error("Invalid beat values.file_id for "+requested);
  // File_ID is copied verbatim from the verified live catalog by Visual Planning.
  // No hardcoded ID->video mapping exists in the renderer.
  const filename=String(values.clip_name||"").trim();
  if(filename && filename!==requested && filename!==requested+".mp4") {
    // The optional clip_name is informative; a catalog Visual_id is canonical.
    if(!CLIP_ID.test(requested)&&filename!==requested)throw new Error("Clip filename mismatch");
  }
  const max=Number(values.max_duration_sec || values.duration_sec || 0);
  return {id:requested,name:filename,fileId,status:"Ready",duration:max>0?max:null};
}

export function assertClipFitsBeat({beatFrames,fps,mediaSeconds,catalogSeconds=null,id}) {
  if(!Number.isInteger(beatFrames)||beatFrames<1||!(fps>0))throw new Error("Invalid clip beat frames");
  if(!Number.isFinite(mediaSeconds)||mediaSeconds<=0)throw new Error("Cannot measure MP4 duration for "+id);
  const beatSeconds=beatFrames/fps;
  // Allow only one video frame for container-timebase duration rounding.
  if(beatSeconds>mediaSeconds+1/fps)throw new Error(id+" planned "+beatSeconds.toFixed(3)+"s exceeds real MP4 duration "+mediaSeconds.toFixed(3)+"s");
  if(catalogSeconds!==null && (!(catalogSeconds>0)||beatSeconds>catalogSeconds+1e-5))throw new Error(id+" exceeds live Clips catalog duration cap "+catalogSeconds+"s");
  return true;
}
