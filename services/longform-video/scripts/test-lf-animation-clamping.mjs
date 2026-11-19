// Universal LF animation bounds regression: do not reject out-of-range numeric
// controls, and preserve in-range numbers. Every bounded slot has a fixture.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const loadTsx = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const js = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  mod._compile(js, filename);
};
require.extensions[".tsx"] = loadTsx;
require.extensions[".ts"] = loadTsx;
// Node cannot run webpack's auto-discovery; load individual animation exports.
const animationRegistry = new Proxy({}, {
  get: (_, id) => require(`../Animations/VA_LF_${String(id).slice(-3)}.tsx`).animation,
});
const { normalizeBoundedAnimationValues } = require("../src/clampNumeric.ts");

const cases = [
  {id:"VA-LF-001",values:{usablePct:70},slots:[["usablePct",0,100],["bufferPct",0,100]]},
  {id:"VA-LF-002",values:{beforeLabel:"before",afterLabel:"after",beforePct:80,afterPct:75},
    slots:[["beforePct",0,100],["afterPct",0,100]]},
  {id:"VA-LF-006",values:{value:100},slots:[["decimals",0,2,true]]},
  {id:"VA-LF-008",values:{nodes:["charger","pack"]},slots:[["intensity",1,5]]},
  {id:"VA-LF-009",values:{inputLabel:"in",gateLabel:"gate",outputLabel:"out",inputRate:50,outputRate:30},
    slots:[["inputRate",0,100],["outputRate",0,100]]},
  {id:"VA-LF-010",values:{},slots:[["heatLevel",0,100],["hotspotRow",0,4,true],["hotspotCol",0,7,true]]},
  {id:"VA-LF-011",values:{displayedStart:80,displayedEnd:70,usablePct:75},
    slots:[["displayedStart",0,100],["displayedEnd",0,100],["usablePct",0,100]]},
  {id:"VA-LF-013",values:{leftLabel:"a",rightLabel:"b",leftValue:"low",rightValue:"high",leftIntensity:25,rightIntensity:70},
    slots:[["leftIntensity",0,100],["rightIntensity",0,100]]},
  {id:"VA-LF-014",values:{title:"Dashboard"},slots:[["progress",0,100]]},
  {id:"VA-LF-018",values:{},slots:[["vehicles",100,1000000,true],["models",1,100,true],["difference",0,20]]},
  {id:"VA-LF-019",values:{},slots:[["rangeStart",0,100],["rangeEnd",0,100],["healthReference",0,100]]},
];

let assertions=0;
for(const test of cases) {
  const schema=animationRegistry[test.id]?.schema;
  assert.ok(schema, `missing animation schema ${test.id}`);
  for(const [slot,min,max,integer=false] of test.slots) {
    for(const [input,expected] of [[min-123,min],[max+123,max]]) {
      const result=schema.safeParse({...test.values,[slot]:input});
      assert.equal(result.success,true,`${test.id}.${slot} should clamp ${input}: ${result.success?"":JSON.stringify(result.error.issues)}`);
      assert.equal(result.data[slot],expected,`${test.id}.${slot}: expected ${expected}`);
      assertions+=2;
    }
    const middle=integer?Math.round((min+max)/2):(min+max)/2;
    const parsed=schema.parse({...test.values,[slot]:middle});
    assert.equal(parsed[slot],middle,`${test.id}.${slot}: in-range value changed`);
    assertions++;
    if(integer) {
      assert.equal(schema.parse({...test.values,[slot]:min+.7})[slot],Math.round(min+.7));
      assertions++;
    }
  }
}
assert.equal(animationRegistry["VA-LF-008"].schema.parse({
  nodes:["charger","pack"],intensity:.6
}).intensity,1);
assert.equal(animationRegistry["VA-LF-008"].schema.parse({
  nodes:["charger","pack"],intensity:1.6
}).intensity,1.6);
assert.equal(animationRegistry["VA-LF-008"].schema.safeParse({
  nodes:["charger","pack"],intensity:"not a number"
}).success,false);
const legacyLongTitle="An intentionally extra-long editorial QA title that should never be rejected just because we clamp numbers";
const legacy = normalizeBoundedAnimationValues(animationRegistry["VA-LF-016"].schema, {title:legacyLongTitle,footer:"QA"});
assert.equal(legacy.title,legacyLongTitle,"do not newly reject or truncate existing preview text");
const clampedPreview = normalizeBoundedAnimationValues(animationRegistry["VA-LF-008"].schema,
  {title:legacyLongTitle,nodes:["charger","pack"],intensity:0.6});
assert.equal(clampedPreview.intensity,1,"render must use the normalized intensity");
assert.equal(clampedPreview.title,legacyLongTitle,"clamp must preserve unrelated text");
console.log(`PASS: ${assertions+6} animation bounds assertions across ${cases.length} numeric-control animations`);
