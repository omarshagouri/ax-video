import assert from "node:assert/strict";
import test from "node:test";
import { getResumableSessionURL } from "./assembly-gcs.mjs";

const url = "https://storage.googleapis.com/upload/storage/v1/b/example/o?uploadType=resumable&upload_id=secret";

test("extracts Gaxios/Fetch Headers Location (root cause regression)", () => {
  const response = { status: 200, headers: new Headers({ Location: url }) };
  assert.equal(getResumableSessionURL(response), url);
});

test("supports legacy object-shaped headers", () => {
  assert.equal(getResumableSessionURL({ status: 200, headers: { location: url } }), url);
  assert.equal(getResumableSessionURL({ status: 200, headers: { Location: url } }), url);
});

test("missing Location gives useful HTTP status without leaking upload token", () => {
  assert.throws(
    () => getResumableSessionURL({ status: 200, headers: new Headers() }),
    (error) => error.message.includes("Location") && error.message.includes("200") &&
      !error.message.includes("upload_id")
  );
});

test("rejects insecure and malformed session URIs", () => {
  assert.throws(() => getResumableSessionURL({ headers: new Headers({ Location: "http://example.com/upload" }) }), /non-HTTPS/);
  assert.throws(() => getResumableSessionURL({ headers: new Headers({ Location: "not a URL" }) }), /invalid/);
});
