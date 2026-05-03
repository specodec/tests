#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'vectors/manifest.json'), 'utf8'));

const langs = ['ts', 'py', 'rust', 'go', 'kotlin', 'dart', 'swift'];
let passRt = 0, failRt = 0;
let passDec = 0, failDec = 0;

// JSON deep comparison with numeric tolerance for float32 precision issues
function jsonDeepEqual(a, b, tolerance = 1e-6) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'number') {
    // For -0 vs 0, use Object.is comparison
    if (Object.is(a, -0) || Object.is(b, -0)) {
      return Object.is(a, b);
    }
    // For regular numbers, use tolerance
    return Math.abs(a - b) <= tolerance;
  }
  
  if (typeof a === 'string' || typeof a === 'boolean' || a === null) {
    return a === b;
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => jsonDeepEqual(v, b[i], tolerance));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    if (!ka.every(k => kb.includes(k))) return false;
    return ka.every(k => jsonDeepEqual(a[k], b[k], tolerance));
  }
  
  return false;
}

for (const lang of langs) {
  const outDir = path.join(__dirname, `output_emit_${lang}`);
  const expDir = path.join(__dirname, 'output_emit_ts');
  if (!fs.existsSync(outDir)) {
    console.log(`SKIP ${lang}: output directory missing`);
    continue;
  }
  for (const name of manifest.testModels) {
    // Roundtrip verification (msgpack + json)
    for (const [fmt, ext] of [['mp', 'msgpack'], ['json', 'json']]) {
      const fname = `${name}.${ext}`;
      const actual = path.join(outDir, fname);
      const expected = path.join(__dirname, 'output_emit_ts', fname);

      if (!fs.existsSync(actual)) {
        console.log(`FAIL ${lang} ${name} ${fmt}: missing`);
        failRt++; continue;
      }
      const a = fs.readFileSync(actual);
      const e = fs.readFileSync(expected);
      if (!a.equals(e)) {
        console.log(`FAIL ${lang} ${name} ${fmt}: bytes differ (got ${a.length}B, want ${e.length}B)`);
        failRt++;
      } else {
        passRt++;
      }
    }
    
    // Decode verification (.decoded.json vs .expected.json)
    const decoded = path.join(outDir, `${name}.decoded.json`);
    const expectedJson = path.join(expDir, `${name}.json`);
    
    if (!fs.existsSync(decoded)) {
      console.log(`FAIL ${lang} ${name} dec: missing .decoded.json`);
      failDec++; continue;
    }
    if (!fs.existsSync(expectedJson)) {
      console.log(`SKIP ${lang} ${name} dec: missing expected`);
      continue;
    }
    
    const d = fs.readFileSync(decoded, 'utf8');
    const e = fs.readFileSync(expectedJson, 'utf8');
    
    // Use JSON deep comparison instead of string comparison
    try {
      const jd = JSON.parse(d);
      const je = JSON.parse(e);
      if (jsonDeepEqual(jd, je)) {
        passDec++;
      } else {
        console.log(`FAIL ${lang} ${name} dec: JSON differs`);
        failDec++;
      }
    } catch (err) {
      console.log(`FAIL ${lang} ${name} dec: JSON parse error`);
      failDec++;
    }
  }
}

console.log('');
console.log('══════════════════════════════════════');
console.log(`Emit roundtrip: ${passRt} passed, ${failRt} failed`);
console.log(`Emit decode:    ${passDec} passed, ${failDec} failed`);
console.log('══════════════════════════════════════');
if (failRt > 0 || failDec > 0) process.exit(1);
