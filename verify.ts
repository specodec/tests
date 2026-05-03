import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { decode as mpDecode } from "@msgpack/msgpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const outputIdx = args.indexOf("--output");
const goldenIdx = args.indexOf("--golden");

const OUTPUT_DIR = outputIdx >= 0 ? args[outputIdx + 1] : null;
const GOLDEN_DIR = goldenIdx >= 0 ? args[goldenIdx + 1] : path.join(__dirname, "golden");

const mpOpts = { useBigInt64: true };
const BASE = __dirname;
const VEC = path.join(BASE, "vectors");
const manifest = JSON.parse(fs.readFileSync(path.join(VEC, "manifest.json"), "utf-8"));

let passed = 0, failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e: any) {
    failed++;
    console.log(`  FAIL ${name} — ${e.message}`);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function filesEqual(p1: string, p2: string): boolean {
  const b1 = fs.readFileSync(p1);
  const b2 = fs.readFileSync(p2);
  if (b1.length !== b2.length) return false;
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) return false;
  }
  return true;
}

const REF = GOLDEN_DIR;

// ═══════════════════════════════════════════
// Part 1: Golden self-check (only when no --output)
// ═══════════════════════════════════════════

if (!OUTPUT_DIR) {
  console.log("═══ Part 1: Golden self-check vs @msgpack/msgpack + JSON.parse ═══");

  const tsResults = JSON.parse(fs.readFileSync(path.join(REF, "results.json"), "utf-8"));

  // --- Scalars ---
  for (const [name, spec] of Object.entries(manifest.scalars)) {
    if (!tsResults.scalars[name]?.pass) continue;
    test(`Golden ${name} vs @msgpack`, () => {
      const buf = fs.readFileSync(path.join(REF, "scalars", name + ".mp"));
      const decoded = mpDecode(new Uint8Array(buf), mpOpts);
      if (spec.valueType === "bigint") {
        assert(typeof decoded === "bigint", `expected bigint, got ${typeof decoded}`);
        assert(decoded.toString() === spec.value, `${decoded} !== ${spec.value}`);
      } else if (spec.valueType === "bytes") {
        assert(Buffer.isBuffer(decoded) || decoded instanceof Uint8Array, "expected bytes");
        assert(Buffer.from(decoded).toString("base64") === spec.value, "bytes mismatch");
      } else if (spec.valueType === "string") {
        assert(decoded === spec.value, `${JSON.stringify(decoded)} !== ${JSON.stringify(spec.value)}`);
      } else if (spec.valueType === "number") {
        assert(typeof decoded === "number", `expected number, got ${typeof decoded}`);
        if (spec.type.startsWith("float")) {
          assert(Math.abs(decoded - spec.value) < Math.abs(spec.value) * 1e-6 + 1e-15, `${decoded} !== ${spec.value}`);
        } else {
          assert(decoded === spec.value, `${decoded} !== ${spec.value}`);
        }
      } else if (spec.valueType === "boolean") {
        assert(decoded === spec.value, `${decoded} !== ${spec.value}`);
      }
    });
  }

  // --- Objects ---
  function manifestToNorm(val: any): any {
    if (val && typeof val === "object" && val.__type === "bigint") return { _t: "bigint", v: val.__value };
    if (val && typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) return { _t: "bytes", v: Buffer.from(val.data).toString("base64") };
    if (val && typeof val === "object" && !Array.isArray(val) && !("_t" in val)) {
      const o: any = {};
      for (const [k, v] of Object.entries(val)) o[k] = manifestToNorm(v);
      return o;
    }
    if (Array.isArray(val)) return val.map(manifestToNorm);
    return val;
  }

  function mpDecodedToNorm(val: any): any {
    if (typeof val === "bigint") return { _t: "bigint", v: val.toString() };
    if (Buffer.isBuffer(val) || val instanceof Uint8Array) return { _t: "bytes", v: Buffer.from(val).toString("base64") };
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const o: any = {};
      for (const [k, v] of Object.entries(val)) o[k] = mpDecodedToNorm(v);
      return o;
    }
    if (Array.isArray(val)) return val.map(mpDecodedToNorm);
    return val;
  }

  function compare(got: any, expected: any, path: string = "") {
    if (expected && typeof expected === "object" && expected._t === "bigint") {
      const gotStr = (got && got._t === "bigint") ? got.v : (typeof got === "string") ? got : (typeof got === "number") ? String(Math.round(got)) : String(got);
      assert(gotStr === expected.v, `${path}: bigint ${gotStr} !== ${expected.v}`);
      return;
    }
    if (expected && typeof expected === "object" && expected._t === "bytes") {
      const gotB64 = (got && got._t === "bytes") ? got.v : (typeof got === "string") ? got : String(got);
      assert(gotB64 === expected.v, `${path}: bytes ${gotB64} !== ${expected.v}`);
      return;
    }
    if (Array.isArray(expected)) {
      assert(Array.isArray(got), `${path}: expected array, got ${typeof got}`);
      assert(got.length === expected.length, `${path}: array length ${got.length} !== ${expected.length}`);
      for (let i = 0; i < expected.length; i++) compare(got[i], expected[i], `${path}[${i}]`);
      return;
    }
    if (expected && typeof expected === "object") {
      assert(got && typeof got === "object" && !Array.isArray(got), `${path}: expected object`);
      for (const k of Object.keys(expected)) {
        assert(k in got, `${path}.${k}: missing key`);
        compare(got[k], expected[k], `${path}.${k}`);
      }
      return;
    }
    if (typeof expected === "number") {
      if (Number.isNaN(expected)) { assert(Number.isNaN(got), `${path}: expected NaN`); return; }
      const tol = Math.abs(expected) * 1e-6 + 1e-15;
      assert(typeof got === "number", `${path}: expected number, got ${typeof got}`);
      assert(Math.abs(got - expected) <= tol, `${path}: ${got} !== ${expected}`);
      return;
    }
    assert(got === expected, `${path}: ${JSON.stringify(got)} !== ${JSON.stringify(expected)}`);
  }

  for (const [name, expectedRaw] of Object.entries(manifest.objects)) {
    const objResult = tsResults.objects[name];
    if (!objResult) continue;
    const expected = manifestToNorm(expectedRaw);

    if (objResult.mp === true) {
      test(`Golden ${name}.msgpack vs @msgpack`, () => {
        const buf = fs.readFileSync(path.join(REF, name + ".msgpack"));
        const decoded = mpDecodedToNorm(mpDecode(new Uint8Array(buf), mpOpts));
        compare(decoded, expected, name);
      });
    }

    if (objResult.json === true) {
      test(`Golden ${name}.json vs JSON.parse`, () => {
        const raw = fs.readFileSync(path.join(REF, name + ".json"), "utf-8");
        const decoded = JSON.parse(raw);
        compare(decoded, expected, name);
      });
    }
  }
}

// ═══════════════════════════════════════════
// Part 2: Compare output vs golden
// ═══════════════════════════════════════════

if (OUTPUT_DIR) {
  console.log("═══ Part 2: Compare output vs golden ═══");

  const goldenResults = JSON.parse(fs.readFileSync(path.join(REF, "results.json"), "utf-8"));
  const outputResults = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, "results.json"), "utf-8"));

  // --- Scalars ---
  for (const [name, spec] of Object.entries(manifest.scalars)) {
    if (!goldenResults.scalars[name]?.pass) continue;
    if (!outputResults.scalars[name]?.pass) continue;
    test(`scalar ${name}`, () => {
      const refPath = path.join(REF, "scalars", name + ".mp");
      const outPath = path.join(OUTPUT_DIR, "scalars", name + ".mp");
      assert(fs.existsSync(refPath), `Golden missing: ${refPath}`);
      assert(fs.existsSync(outPath), `Output missing: ${outPath}`);
      assert(filesEqual(refPath, outPath), `scalar ${name}: bytes differ from golden`);
    });
  }

  // --- Objects ---
  for (const name of manifest.testModels) {
    const objResult = outputResults.objects[name];
    const goldenObj = goldenResults.objects[name];
    if (!goldenObj) continue;

    if (goldenObj.mp) {
      if (objResult?.mp === true) {
        test(`${name}.msgpack`, () => {
          const refPath = path.join(REF, name + ".msgpack");
          const outPath = path.join(OUTPUT_DIR, name + ".msgpack");
          assert(fs.existsSync(refPath), `Golden missing`);
          assert(fs.existsSync(outPath), `Output missing`);
          assert(filesEqual(refPath, outPath), `${name}.msgpack: bytes differ from golden`);
        });
      }
    }

    if (goldenObj.json) {
      if (objResult?.json === true) {
        test(`${name}.json`, () => {
          const refPath = path.join(REF, name + ".json");
          const outPath = path.join(OUTPUT_DIR, name + ".json");
          assert(fs.existsSync(refPath), `Golden missing`);
          assert(fs.existsSync(outPath), `Output missing`);
          assert(filesEqual(refPath, outPath), `${name}.json: bytes differ from golden`);
        });
      }
    }

    if (goldenObj.gron) {
      if (objResult?.gron === true) {
        test(`${name}.gron`, () => {
          const refPath = path.join(REF, name + ".gron");
          const outPath = path.join(OUTPUT_DIR, name + ".gron");
          assert(fs.existsSync(refPath), `Golden missing`);
          assert(fs.existsSync(outPath), `Output missing`);
          assert(filesEqual(refPath, outPath), `${name}.gron: bytes differ from golden`);
        });
      }
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);