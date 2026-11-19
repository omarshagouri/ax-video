import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  parseRenderDelivery, assertRenderDeliveryReady, deliverRenderedMp4,
} from "./render-delivery.mjs";
import { resolveRenderDeliveryBucket } from "./assembly-gcs.mjs";

test("legacy mode remains default until Make opts in", () => {
  assert.equal(parseRenderDelivery(undefined), "inline");
  assert.equal(parseRenderDelivery("gcs"), "gcs");
  assert.throws(() => parseRenderDelivery("bad"), /delivery must/);
});

test("GCS mode fails fast with 503 and does not start rendering when unconfigured", () => {
  assert.equal(resolveRenderDeliveryBucket({AXLF_RENDER_GCS_BUCKET:"new-bucket",AXLF_ASSEMBLY_GCS_BUCKET:"old-bucket"}),"new-bucket");
  assert.equal(resolveRenderDeliveryBucket({AXLF_ASSEMBLY_GCS_BUCKET:"old-bucket"}),"old-bucket");
  assert.throws(
    () => assertRenderDeliveryReady("gcs",{}),
    e => e.statusCode===503 && e.message.includes("AXLF_RENDER_GCS_BUCKET")
  );
  assert.doesNotThrow(() => assertRenderDeliveryReady("inline",{}));
});

test("GCS response remains small with a multi-megabyte MP4 and never exposes base64", async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"axlf-delivery-"));
  const original=process.env.AXLF_RENDER_GCS_BUCKET;
  try{
    process.env.AXLF_RENDER_GCS_BUCKET="test-lf-bucket";
    const file=path.join(dir,"large.mp4");
    fs.writeFileSync(file,Buffer.alloc(8*1024*1024,12));
    let calls=0;
    const result=await deliverRenderedMp4({
      filePath:file,filename:"AX-LF-006_CH5_P1.mp4",videoId:"AX-LF-006_CH5_P1",
      delivery:"gcs",upload:async(p,name,id)=>{
        calls++;
        assert.equal(p,file);assert.equal(name,"AX-LF-006_CH5_P1.mp4");assert.equal(id,"AX-LF-006_CH5_P1");
        return {storage_bucket:"test-lf-bucket",storage_object:"chapter-renders/AX-LF-006_CH5_P1/file.mp4",
          download_url:"https://storage.googleapis.com/signed-test",download_expires_at:"2026-10-27T17:00:00Z"};
      }
    });
    assert.equal(calls,1);assert.equal(result.delivery,"gcs");
    assert.equal(result.size_bytes,8*1024*1024);
    assert.equal(result.content_type,"video/mp4");
    assert.ok(result.download_url.startsWith("https://"));
    assert.ok(!Object.hasOwn(result,"file_base64"));
    assert.ok(Buffer.byteLength(JSON.stringify(result))<1200);
  }finally{
    if(original===undefined) delete process.env.AXLF_RENDER_GCS_BUCKET;
    else process.env.AXLF_RENDER_GCS_BUCKET=original;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test("GCS upload failure is never returned as successful completion", async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"axlf-delivery-"));
  const original=process.env.AXLF_RENDER_GCS_BUCKET;
  try{
    process.env.AXLF_RENDER_GCS_BUCKET="test-lf-bucket";
    const file=path.join(dir,"v.mp4");fs.writeFileSync(file,Buffer.alloc(32,5));
    await assert.rejects(deliverRenderedMp4({filePath:file,filename:"v.mp4",videoId:"v",
      delivery:"gcs",upload:async()=>{throw new Error("upload failed");}}),/upload failed/);
    await assert.rejects(deliverRenderedMp4({filePath:file,filename:"v.mp4",videoId:"v",
      delivery:"gcs",upload:async()=>({storage_object:"partial"})}),/verified object/);
  }finally{
    if(original===undefined) delete process.env.AXLF_RENDER_GCS_BUCKET;
    else process.env.AXLF_RENDER_GCS_BUCKET=original;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test("existing Base64 payload still works for unmigrated Make clients", async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"axlf-delivery-"));
  try{
    const file=path.join(dir,"small.mp4");fs.writeFileSync(file,Buffer.from("mock mp4"));
    const result=await deliverRenderedMp4({filePath:file,filename:"small.mp4",videoId:"small",delivery:"inline"});
    assert.equal(result.file_base64,Buffer.from("mock mp4").toString("base64"));
    assert.equal(result.delivery,"inline");
    assert.equal(result.size_bytes,8);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});


test("oversized legacy Base64 response fails cleanly with 413 rather than Cloud Run 500", async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"axlf-delivery-"));
  try {
    const file=path.join(dir,"oversized.mp4");
    fs.writeFileSync(file,Buffer.alloc(23*1024*1024,3));
    await assert.rejects(
      deliverRenderedMp4({filePath:file,filename:"oversized.mp4",videoId:"oversized",delivery:"inline"}),
      err=>err.statusCode===413 && err.message.includes("delivery:gcs")
    );
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
