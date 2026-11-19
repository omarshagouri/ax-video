// Bounded JSON delivery for Make: never inline full MP4s in GCS mode.
// Legacy Base64 remains opt-in/default until the Make scenario is updated.
import fs from "node:fs";
import { resolveRenderDeliveryBucket, uploadRenderedMp4ToGCS } from "./assembly-gcs.mjs";

export const DELIVERY_GCS = "gcs";
export const DELIVERY_INLINE = "inline";
// Conservative ceiling: Base64 grows ~33%, and non-streamed HTTP replies have a 32 MiB limit.
export const MAX_INLINE_MP4_BYTES = 22 * 1024 * 1024;

export function parseRenderDelivery(value) {
  if (value === undefined || value === null || value === "") return DELIVERY_INLINE;
  if (value === DELIVERY_GCS || value === DELIVERY_INLINE) return value;
  throw new Error('delivery must be "gcs" or "inline"');
}

export function assertRenderDeliveryReady(delivery, env = process.env) {
  if (delivery === DELIVERY_GCS && !resolveRenderDeliveryBucket(env)) {
    throw Object.assign(new Error("GCS delivery unavailable: set AXLF_RENDER_GCS_BUCKET (or AXLF_ASSEMBLY_GCS_BUCKET) on this Cloud Run service before rendering"), { statusCode: 503 });
  }
}

export async function deliverRenderedMp4({
  filePath, filename, videoId, delivery,
  upload = uploadRenderedMp4ToGCS,
}) {
  const mode = parseRenderDelivery(delivery);
  assertRenderDeliveryReady(mode);
  const sizeBytes = fs.statSync(filePath).size;
  if (sizeBytes <= 0) throw new Error("Rendered MP4 was empty");
  if (mode === DELIVERY_GCS) {
    const data = await upload(filePath, filename, videoId);
    if (!data?.storage_object || !data?.download_url || !data?.download_expires_at) {
      throw new Error("GCS upload did not return a verified object and signed download URL");
    }
    return {
      delivery: DELIVERY_GCS,
      filename,
      size_bytes: sizeBytes,
      content_type: "video/mp4",
      storage_bucket: data.storage_bucket,
      storage_object: data.storage_object,
      download_url: data.download_url,
      download_expires_at: data.download_expires_at,
    };
  }
  if (sizeBytes > MAX_INLINE_MP4_BYTES) {
    throw Object.assign(new Error("Rendered MP4 exceeds safe Base64 response size. Use delivery:gcs and download_url in Make."), {statusCode:413});
  }
  return {
    delivery: DELIVERY_INLINE,
    filename,
    size_bytes: sizeBytes,
    file_base64: fs.readFileSync(filePath).toString("base64"),
  };
}
