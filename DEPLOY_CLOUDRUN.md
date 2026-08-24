# Deploy the render service to Cloud Run

Runs next to your existing `ax-render` in the same `ampcorex` project / `europe-west1`.
It does NOT replace ax-render; it's a second service.

## One-time deploy

```bash
cd ax-video

gcloud run deploy ax-video-render \
  --source . \
  --project ampcorex \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 4 \
  --timeout 900 \
  --set-env-vars RENDER_API_KEY=<YOUR_KEY>     # TODO: set your real key
```

Notes:
- Remotion rendering is CPU/memory heavy: 4 CPU / 4Gi and a long timeout are sensible for 60-70s videos. Tune later.
- The Dockerfile downloads Chrome Headless Shell at build time (`npx remotion browser ensure`), so cold renders don't stall.
- `RENDER_API_KEY` must match the `x-api-key` header the Make scenario sends.

## Endpoint

`POST https://<cloud-run-url>/render-video`
Header: `x-api-key: <YOUR_KEY>`
Body: `{ "manifest": { ...VideoManifest... } }`
Returns: `{ "status":"ok", "filename":"AX-017-SF_FINAL.mp4", "file_base64":"..." }`

Same shape as the old ax-render `/assemble-video`, so Make saves the base64 to Drive exactly like Agent 8 does today.
