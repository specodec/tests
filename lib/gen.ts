#!/usr/bin/env node
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode as mpEncode } from '@msgpack/msgpack';
import { scalars, genInstance } from './vectors.ts';
import { specodecJson, specodecPrettyJson, specodecGron } from './json-format.ts';
import { generateDump } from './dump/index.ts';
import { generateRunner } from './runner/index.ts';
import { Lang, LANGS } from './field-naming.ts';

const getInstance = genInstance;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE = path.dirname(__dirname); // tests/interop
const REPO = path.dirname(BASE);
const ROOT = path.dirname(REPO);
const VEC = path.join(BASE, 'vectors');
const SPECS = path.join(ROOT, 'specs');
const GEN = path.join(SPECS, 'generated', 'alltypes');
const TSP_OUTPUT = path.join(ROOT, 'tsp-output');

const mpOpts = { useBigInt64: true };

// ═══════════════════════════════════════════
// Model definitions (loaded from TypeSpec manifest)
// ═══════════════════════════════════════════

export interface FieldDef {
  name: string;
  type: string;
  optional?: boolean;
  isArray?: boolean;
  isRecord?: boolean;
  isModel?: boolean;
}

export interface ModelDef {
  name: string;
  fields: FieldDef[];
}

export const models: Record<string, ModelDef> = {};
export const modelOrder: string[] = [];
export let testModels: string[] = [];

function loadModelsFromManifest(): void {
  const manifestPath = path.join(TSP_OUTPUT, '@specodec', 'typespec-specodec-ts', 'models.json');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}\nRun: npx tsp compile ../../specs/alltypes.tsp --emit "@specodec/typespec-specodec-ts"`);
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  const skipModels = new Set([
    'TypeSpec', 'ServiceOptions', 'DiscriminatedOptions', 'ExampleOptions',
    'OperationExample', 'VisibilityFilter', 'Array', 'EnumMember', 'Model',
    'Scalar', 'Enum', 'Union', 'ModelProperty', 'Operation', 'Namespace',
    'Interface', 'UnionVariant', 'StringTemplate'
  ]);
  
  for (const [name, def] of Object.entries(manifest.models || {})) {
    if (skipModels.has(name)) continue;
    models[name] = def as ModelDef;
    modelOrder.push(name);
  }
  
  testModels = modelOrder.filter(n => !n.startsWith('Opt') || models[n].fields.some(f => !f.optional));
}

// ═══════════════════════════════════════════
// CLI Argument Parsing
// ═══════════════════════════════════════════

interface CliArgs {
  stage: 'all' | 'vectors' | 'spec' | 'emit';
  langs: Lang[];
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  
  let stage: 'all' | 'vectors' | 'spec' | 'emit' = 'all';
  let langs: Lang[] = [...LANGS];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--stage' || arg === '-s') {
      const val = args[++i];
      if (!val || !['all', 'vectors', 'spec', 'emit'].includes(val)) {
        console.error('Invalid stage. Use: all, vectors, spec, emit');
        process.exit(1);
      }
      stage = val as CliArgs['stage'];
    }
    
    if (arg === '--lang' || arg === '-l') {
      const val = args[++i];
      if (!val) {
        console.error('Missing language. Use: ts, py, rust, go, kotlin, dart, swift');
        process.exit(1);
      }
      const requestedLangs = val.split(',').map(l => l.trim());
      for (const l of requestedLangs) {
        if (!LANGS.includes(l as Lang)) {
          console.error(`Invalid language: ${l}. Valid: ${LANGS.join(', ')}`);
          process.exit(1);
        }
      }
      langs = requestedLangs as Lang[];
    }
    
    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: gen.ts [options]

Options:
  --stage, -s <stage>    Run only specific stage
                         Stages: all, vectors, spec, emit
  --lang, -l <langs>     Generate only specific languages (comma-separated)
                         Languages: ts, py, rust, go, kotlin, dart, swift
  --help, -h             Show this help

Examples:
  gen.ts                           # Run all stages for all languages
  gen.ts --stage vectors           # Generate only test vectors
  gen.ts --stage emit --lang rust  # Generate only Rust dump/runner
  gen.ts --lang ts,py,go           # Generate only TS, Python, Go
`);
      process.exit(0);
    }
  }
  
  return { stage, langs };
}

// ═══════════════════════════════════════════
// Stage 1: Generate test vectors
// ═══════════════════════════════════════════

function generateVectors(): void {
  console.log('Stage 1: Generating test vectors...');
  
  loadModelsFromManifest(); // Load from TypeSpec manifest
  
  fs.mkdirSync(path.join(VEC, 'scalars'), { recursive: true });
  
  // Scalars
  for (const [name, { value }] of Object.entries(scalars)) {
    const obj = { v: value };
    const json = specodecJson(obj);
    const mp = Buffer.from(mpEncode(obj, mpOpts));
    fs.writeFileSync(path.join(VEC, 'scalars', `${name}.json`), json);
    fs.writeFileSync(path.join(VEC, 'scalars', `${name}.msgpack`), mp);
    fs.writeFileSync(path.join(VEC, 'scalars', `${name}.pretty.json`), specodecPrettyJson(obj));
    fs.writeFileSync(path.join(VEC, 'scalars', `${name}.gron`), specodecGron(obj));
  }
  
// Models
const manifest = {
  testModels: Object.keys(models).filter(n => !n.startsWith('Opt') || models[n].fields.some(f => !f.optional)),
  models: Object.keys(models)
};
  
  for (const name of manifest.testModels) {
    const obj = getInstance(name);
    const json = specodecJson(obj);
    const mp = Buffer.from(mpEncode(obj, mpOpts));
    fs.writeFileSync(path.join(VEC, `${name}.json`), json);
    fs.writeFileSync(path.join(VEC, `${name}.msgpack`), mp);
    fs.writeFileSync(path.join(VEC, `${name}.pretty.json`), specodecPrettyJson(obj));
    fs.writeFileSync(path.join(VEC, `${name}.gron`), specodecGron(obj));
  }
  
  fs.writeFileSync(path.join(VEC, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  // TypeSchema
  const typeSchema: Record<string, unknown> = { models: {} };
  for (const [name, m] of Object.entries(models)) {
    typeSchema.models[name] = {
      fields: m.fields.map(f => ({
        name: f.name,
        type: f.type,
        optional: f.optional ?? false,
        array: f.isArray ?? false
      }))
    };
  }
  fs.writeFileSync(path.join(VEC, 'typeschema.json'), JSON.stringify(typeSchema, null, 2));
  
  console.log(`  scalars: ${Object.keys(scalars).length} files`);
  console.log(`  objects: ${manifest.testModels.length} pairs (json+msgpack)`);
  console.log(`  models:  ${Object.keys(models).length} total, ${manifest.testModels.length} test vectors`);
}

// ═══════════════════════════════════════════
// Stage 2: Generate TypeSpec spec file
// ═══════════════════════════════════════════

function generateSpec(): void {
  console.log('Stage 2: Generating TypeSpec spec...');
  
  let tspContent = `// Generated by gen.ts. DO NOT EDIT.\n\nimport "@specodec/typespec-specodec-core";\n\nusing Specodec.Core;\n\n`;
  for (const [name, m] of Object.entries(models)) {
    tspContent += `@specodec\nmodel ${name} {\n`;
    for (const f of m.fields) {
      const tspType = f.isArray ? `${f.type}[]` : f.type;
      tspContent += `  ${f.name}${f.optional ? '?' : ''}: ${tspType};\n`;
    }
    tspContent += `}\n\n`;
  }
  
  fs.mkdirSync(SPECS, { recursive: true });
  fs.writeFileSync(path.join(SPECS, 'alltypes.tsp'), tspContent);
  
  console.log(`  Wrote ${path.join(SPECS, 'alltypes.tsp')}`);
}

// ═══════════════════════════════════════════
// Stage 3: Generate dump and runner files
// ═══════════════════════════════════════════

const EMIT_DIRS: Record<Lang, { dump: string[], runner: string[] }> = {
  ts: {
    dump: [path.join(BASE, 'emit_ts', 'src', 'dump_emit.ts')],
    runner: [path.join(BASE, 'emit_ts', 'src', 'run_emit.ts')]
  },
  py: {
    dump: [path.join(BASE, 'emit_py', 'dump_emit.py')],
    runner: [path.join(BASE, 'emit_py', 'run_emit.py')]
  },
  rust: {
    dump: [path.join(BASE, 'emit_rust', 'src', 'dump_emit.rs')],
    runner: [path.join(BASE, 'emit_rust', 'src', 'run_emit.rs')]
  },
  go: {
    dump: [path.join(BASE, 'emit_go', 'dump_emit.go')],
    runner: [path.join(BASE, 'emit_go', 'run_emit.go')]
  },
  kotlin: {
    dump: [path.join(BASE, 'emit_kotlin', 'src', 'dump_emit.kt')],
    runner: [path.join(BASE, 'emit_kotlin', 'src', 'run_emit.kt')]
  },
  dart: {
    dump: [path.join(BASE, 'emit_dart', 'bin', 'dump_emit.dart')],
    runner: [path.join(BASE, 'emit_dart', 'bin', 'run_emit.dart')]
  },
  swift: {
    dump: [path.join(BASE, 'emit_swift', 'Sources', 'run_swift', 'dump_emit.swift')],
    runner: [path.join(BASE, 'emit_swift', 'Sources', 'run_swift', 'run_emit.swift')]
  }
};

function generateEmit(langs: Lang[]): void {
  console.log('Stage 3: Generating emit runners...');
  
  for (const lang of langs) {
    const { dump, runner } = EMIT_DIRS[lang];
    
    for (const p of dump) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, generateDump(lang));
    }
    
    for (const p of runner) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, generateRunner(lang));
    }
    
    console.log(`  ${lang}: dump + runner`);
  }
}

// ═══════════════════════════════════════════
// Main Entry Point
// ═══════════════════════════════════════════

const { stage, langs } = parseArgs();

console.log('══════════════════════════════════════');
console.log(`Specodec Test Generator`);
console.log(`Stage: ${stage}`);
console.log(`Languages: ${langs.join(', ')}`);
console.log('══════════════════════════════════════\n');

if (stage === 'all' || stage === 'vectors') {
  generateVectors();
}

if (stage === 'all' || stage === 'spec') {
  generateSpec();
}

if (stage === 'all' || stage === 'emit') {
  generateEmit(langs);
}

console.log('\nDone.');