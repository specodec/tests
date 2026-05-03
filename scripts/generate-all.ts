import fs from 'fs';
import path from 'path';
import { Buffer } from 'node:buffer';
import { encode as mpEncode } from '@msgpack/msgpack';
import { models, modelOrder, testModels, SUB_MODELS, SCALARS } from '../lib/models.ts';
import { getInstance, scalars } from '../lib/vectors.ts';
import { specodecJson, specodecPrettyJson, specodecGron } from '../lib/json-format.ts';
import { generateDump } from '../lib/dump/index.ts';
import { generateRunner } from '../lib/runner/index.ts';

const BASE = '/home/ytr/Specodec/tests/interop';
const VEC = path.join(BASE, 'vectors');
const SPECS = path.join(BASE, '..', '..', 'specs');

const mpOpts = { useBigInt64: true };

// ═══════════════════════════════════════════
// Generate alltypes.tsp
// ═══════════════════════════════════════════

function tspType(type: string, opts: { isArray?: boolean }): string {
  if (opts.isArray) return tspType(type, {}) + '[]';
  return type;
}

function emitTSP(): void {
  let out = 'import "@typespec/http";\n\nusing TypeSpec.Http;\n\nnamespace AllTypes {\n\n';
  
  for (const name of modelOrder) {
    const m = models[name];
    out += `  model ${name} {\n`;
    for (const field of m.fields) {
      const opt = field.optional ? '?' : '';
      const t = tspType(field.type, field);
      out += `    ${field.name}${opt}: ${t};\n`;
    }
    out += `  }\n\n`;
  }
  
  out += '  interface TestService {\n';
  for (const name of testModels) {
    out += `    @post echo${name}(...${name}): ${name};\n`;
  }
  out += '  }\n}\n';
  
  fs.writeFileSync(path.join(SPECS, 'alltypes.tsp'), out);
  console.log(`Wrote ${path.join(SPECS, 'alltypes.tsp')}`);
}

// ═══════════════════════════════════════════
// Generate typeschema.json
// ═══════════════════════════════════════════

function emitSchema(): void {
  const schema: Record<string, { fields: unknown[], recursive: boolean }> = {};
  for (const name of modelOrder) {
    const m = models[name];
    schema[name] = {
      fields: m.fields.map(f => {
        const s: Record<string, unknown> = { name: f.name, type: f.type };
        if (f.optional) s.optional = true;
        if (f.isArray) s.isArray = true;
        if (f.isModel) s.isModel = true;
        return s;
      }),
      recursive: !!m.recursive
    };
  }
  fs.writeFileSync(path.join(VEC, 'typeschema.json'), JSON.stringify(schema, null, 2));
  console.log(`Wrote ${path.join(VEC, 'typeschema.json')}`);
}

// ═══════════════════════════════════════════
// Generate test vectors
// ═══════════════════════════════════════════

function emitVectors(): void {
  fs.mkdirSync(path.join(VEC, 'scalars'), { recursive: true });
  
  // Scalar vectors
  for (const [name, { value }] of Object.entries(scalars)) {
    fs.writeFileSync(path.join(VEC, 'scalars', name + '.mp'), mpEncode(value, mpOpts));
  }
  
  // Object vectors
  const objects: Record<string, unknown> = {};
  for (const name of testModels) {
    objects[name] = getInstance(name);
  }
  
  for (const [name, data] of Object.entries(objects)) {
    fs.writeFileSync(path.join(VEC, name + '.json'), specodecJson(data));
    fs.writeFileSync(path.join(VEC, name + '.pretty.json'), specodecPrettyJson(data));
    fs.writeFileSync(path.join(VEC, name + '.gron'), specodecGron(data));
    fs.writeFileSync(path.join(VEC, name + '.msgpack'), mpEncode(data, mpOpts));
  }
  
  // Expected JSON (copy from vectors)
  const expDir = path.join(VEC, 'expected');
  fs.mkdirSync(expDir, { recursive: true });
  for (const name of testModels) {
    fs.writeFileSync(path.join(expDir, name + '.json'), specodecJson(objects[name]));
  }
  
  // Manifest
  const manifest = {
    scalars: Object.fromEntries(Object.entries(scalars).map(([name, { value, type }]) => [
      name,
      {
        type,
        value: typeof value === 'bigint' ? value.toString() 
          : Buffer.isBuffer(value) ? value.toString('base64')
          : Object.is(value, -0) ? -0 : value,
        valueType: typeof value === 'bigint' ? 'bigint' 
          : Buffer.isBuffer(value) ? 'bytes' : typeof value
      }
    ])),
    objects: JSON.parse(JSON.stringify(objects, (key, val) => {
      if (typeof val === 'bigint') return { __type: 'bigint', __value: val.toString() };
      if (Buffer.isBuffer(val)) return { __type: 'bytes', __value: val.toString('base64') };
      return val;
    })),
    testModels
  };
  
  fs.writeFileSync(path.join(VEC, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  console.log(`Generated:`);
  console.log(`  scalars: ${Object.keys(scalars).length} files`);
  console.log(`  objects: ${Object.keys(objects).length} pairs (json+msgpack)`);
  console.log(`  expected: ${testModels.length} files`);
}

// ═══════════════════════════════════════════
// Generate dump and runner files
// ═══════════════════════════════════════════

function emitDumpAndRunners(): void {
  const langs: ('ts' | 'py' | 'rust' | 'go' | 'kotlin' | 'dart' | 'swift')[] = 
    ['ts', 'py', 'rust', 'go', 'kotlin', 'dart', 'swift'];
  
  for (const lang of langs) {
    // Runner
    const runnerPaths: Record<string, string> = {
      ts: path.join(BASE, 'emit_ts', 'src', 'run_emit.ts'),
      py: path.join(BASE, 'emit_py', 'run_emit.py'),
      rust: path.join(BASE, 'emit_rust', 'src', 'run_emit_map.rs'),
      go: path.join(BASE, 'emit_go', 'run_emit_map.go'),
      kotlin: path.join(BASE, 'emit_kotlin', 'src', 'run_emit_map.kt'),
      dart: path.join(BASE, 'emit_dart', 'bin', 'run_emit.dart'),
      swift: path.join(BASE, 'emit_swift', 'Sources', 'run_swift', 'run_emit.swift')
    };
    
    const runnerDir = path.dirname(runnerPaths[lang]);
    if (!fs.existsSync(runnerDir)) fs.mkdirSync(runnerDir, { recursive: true });
    fs.writeFileSync(runnerPaths[lang], generateRunner(lang));
    
    // Dump
    const dumpPaths: Record<string, string> = {
      ts: path.join(BASE, 'emit_ts', 'src', 'dump_emit.ts'),
      py: path.join(BASE, 'emit_py', 'dump_emit.py'),
      rust: path.join(BASE, 'emit_rust', 'src', 'dump_emit.rs'),
      go: path.join(BASE, 'emit_go', 'dump_emit.go'),
      kotlin: path.join(BASE, 'emit_kotlin', 'src', 'dump_emit.kt'),
      dart: path.join(BASE, 'emit_dart', 'bin', 'dump_emit.dart'),
      swift: path.join(BASE, 'emit_swift', 'Sources', 'run_swift', 'dump_emit.swift')
    };
    
    fs.writeFileSync(dumpPaths[lang], generateDump(lang));
  }
  
  console.log('Generated emit runners and dump files for 7 languages.');
}

// ═══════════════════════════════════════════
// Main
// ═══════════════════════════════════════════

console.log(`Total models: ${modelOrder.length}`);
console.log(`Test models: ${testModels.length}`);

emitTSP();
emitSchema();
emitVectors();
emitDumpAndRunners();

console.log('Done.');