// verify.cjs — Byte-for-byte verification:
// 1. TS output is the specodec canonical reference
// 2. All other languages' outputs must be byte-identical to TS
// 3. TS output is also verified against @msgpack/msgpack + JSON.parse for standard interop

const fs = require("fs");
const path = require("path");
const { decode: mpDecode } = require("@msgpack/msgpack");

const mpOpts = { useBigInt64: true };
const BASE = __dirname;
const VEC = path.join(BASE, "vectors");
const manifest = JSON.parse(fs.readFileSync(path.join(VEC, "manifest.json"), "utf-8"));

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.log(`  FAIL ${name} — ${e.message}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

function filesEqual(p1, p2) {
  const b1 = fs.readFileSync(p1);
  const b2 = fs.readFileSync(p2);
  if (b1.length !== b2.length) return false;
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) return false;
  }
  return true;
}

const REF = path.join(BASE, "output_ts");
const LANGS = ["py", "rust", "go", "kotlin", "dart", "swift"];

// Track per-language comparison counts
const langStats = {}; // { lang: { compared: 0, expected: 0 } }
for (const lang of LANGS) langStats[lang] = { compared: 0, expected: 0 };

// ═══════════════════════════════════════════
// Part 1: Verify TS output against standard libs (@msgpack/msgpack + JSON.parse)
// ═══════════════════════════════════════════

console.log("═══ Part 1: TS output vs @msgpack/msgpack + JSON.parse ═══");

const tsResults = JSON.parse(fs.readFileSync(path.join(REF, "results.json"), "utf-8"));

// --- Scalars (MsgPack standard interop) ---
for (const [name, spec] of Object.entries(manifest.scalars)) {
  if (!tsResults.scalars[name]?.pass) continue;
  test(`TS ${name} vs @msgpack`, () => {
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

// --- Objects (semantic comparison of TS output with standard libs) ---
function manifestToNorm(val) {
  if (val && typeof val === "object" && val.__type === "bigint") return { _t: "bigint", v: val.__value };
  if (val && typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) return { _t: "bytes", v: Buffer.from(val.data).toString("base64") };
  if (val && typeof val === "object" && !Array.isArray(val) && !("_t" in val)) { const o = {}; for (const [k, v] of Object.entries(val)) o[k] = manifestToNorm(v); return o; }
  if (Array.isArray(val)) return val.map(manifestToNorm);
  return val;
}

function mpDecodedToNorm(val) {
  if (typeof val === "bigint") return { _t: "bigint", v: val.toString() };
  if (Buffer.isBuffer(val) || val instanceof Uint8Array) return { _t: "bytes", v: Buffer.from(val).toString("base64") };
  if (val && typeof val === "object" && !Array.isArray(val)) { const o = {}; for (const [k, v] of Object.entries(val)) o[k] = mpDecodedToNorm(v); return o; }
  if (Array.isArray(val)) return val.map(mpDecodedToNorm);
  return val;
}

function compare(got, expected, path = "") {
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
    test(`TS ${name}.msgpack vs @msgpack`, () => {
      const buf = fs.readFileSync(path.join(REF, name + ".msgpack"));
      const decoded = mpDecodedToNorm(mpDecode(new Uint8Array(buf), mpOpts));
      compare(decoded, expected, name);
    });
  }

  if (objResult.json === true) {
    test(`TS ${name}.json vs JSON.parse`, () => {
      const raw = fs.readFileSync(path.join(REF, name + ".json"), "utf-8");
      const decoded = JSON.parse(raw);
      compare(decoded, expected, name);
    });
  }
}

// ═══════════════════════════════════════════
// Part 2: Byte-for-byte diff: all languages vs TS
// ═══════════════════════════════════════════

// Calculate expected counts from TS reference
const tsRef = JSON.parse(fs.readFileSync(path.join(REF, "results.json"), "utf-8"));
let expectedScalars = 0;
for (const [, spec] of Object.entries(manifest.scalars)) {
  const r = tsRef.scalars[spec.name] ?? tsRef.scalars[Object.keys(manifest.scalars).find(k => manifest.scalars[k] === spec)];
  expectedScalars++;
}
expectedScalars = Object.values(tsRef.scalars).filter(v => v.pass).length;
let expectedMp = 0, expectedJson = 0, expectedGron = 0;
for (const name of manifest.testModels) {
  const r = tsRef.objects[name];
  if (!r) continue;
  if (r.mp)   expectedMp++;
  if (r.json) expectedJson++;
  if (r.gron) expectedGron++;
}
const expectedPerLang = expectedScalars + expectedMp + expectedJson + expectedGron;

for (const lang of LANGS) {
  const OUT = path.join(BASE, "output_" + lang);
  let langResults;
  try {
    langResults = JSON.parse(fs.readFileSync(path.join(OUT, "results.json"), "utf-8"));
  } catch (e) {
    console.log(`\n═══ ${lang.toUpperCase()} vs TS: byte-for-byte diff ═══`);
    console.log(`  FAIL: no results.json — build failed (0 / ${expectedPerLang} comparisons)`);
    failed++;
    langStats[lang] = { compared: 0, expected: expectedPerLang };
    continue;
  }

  console.log(`\n═══ ${lang.toUpperCase()} vs TS: byte-for-byte diff ═══`);
  let langCompared = 0;

  // Scalars
  for (const [name, spec] of Object.entries(manifest.scalars)) {
    langStats[lang].expected++;
    if (!langResults.scalars[name]?.pass) continue;
    langCompared++;
    test(`${lang} scalar ${name}`, () => {
      const refPath = path.join(REF, "scalars", name + ".mp");
      const outPath = path.join(OUT, "scalars", name + ".mp");
      assert(fs.existsSync(refPath), `TS reference missing: ${refPath}`);
      assert(fs.existsSync(outPath), `Output missing: ${outPath}`);
      assert(filesEqual(refPath, outPath), `${lang} scalar ${name}: bytes differ from TS`);
    });
  }

  // Objects
  for (const name of manifest.testModels) {
    const objResult = langResults.objects[name];
    const tsObj = tsRef.objects[name];
    if (!tsObj) continue;

    if (tsObj.mp) {
      langStats[lang].expected++;
      if (objResult?.mp === true) {
        langCompared++;
        test(`${lang} ${name}.msgpack`, () => {
          const refPath = path.join(REF, name + ".msgpack");
          const outPath = path.join(OUT, name + ".msgpack");
          assert(fs.existsSync(refPath), `TS reference missing`);
          assert(fs.existsSync(outPath), `Output missing`);
          assert(filesEqual(refPath, outPath), `${lang} ${name}.msgpack: bytes differ from TS`);
        });
      }
    }

    if (tsObj.json) {
      langStats[lang].expected++;
      if (objResult?.json === true) {
        langCompared++;
        test(`${lang} ${name}.json`, () => {
          const refPath = path.join(REF, name + ".json");
          const outPath = path.join(OUT, name + ".json");
          assert(fs.existsSync(refPath), `TS reference missing`);
          assert(fs.existsSync(outPath), `Output missing`);
          assert(filesEqual(refPath, outPath), `${lang} ${name}.json: bytes differ from TS`);
        });
      }
    }

    if (tsObj.gron) {
      langStats[lang].expected++;
      if (objResult?.gron === true) {
        langCompared++;
        test(`${lang} ${name}.gron`, () => {
          const refPath = path.join(REF, name + ".gron");
          const outPath = path.join(OUT, name + ".gron");
          assert(fs.existsSync(refPath), `TS reference missing`);
          assert(fs.existsSync(outPath), `Output missing`);
          assert(filesEqual(refPath, outPath), `${lang} ${name}.gron: bytes differ from TS`);
        });
      }
    }
  }

  langStats[lang].compared = langCompared;
  const langExpected = langStats[lang].expected;
  if (langCompared < langExpected) {
    console.log(`  WARNING: only ${langCompared} / ${langExpected} files compared (${langExpected - langCompared} missing)`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

// Per-language comparison summary
console.log("\n═══ Coverage Summary ═══");
let allCovered = true;
for (const lang of LANGS) {
  const { compared, expected } = langStats[lang];
  const ok = compared === expected;
  if (!ok) allCovered = false;
  console.log(`  ${lang.padEnd(8)} ${compared} / ${expected}${ok ? "" : "  ← INCOMPLETE"}`);
}
if (!allCovered) {
  console.log("\n  Some languages had incomplete coverage. Check build failures above.");
  process.exit(1);
}

if (failed > 0) process.exit(1);
