#!/usr/bin/env tsx
import { program, Model, Namespace, navigateTypesInNamespace, Scalar, Type, getNamespaceFullName } from "@typespec/compiler";
import { generateVectors } from "./vectors.ts";
import { generateSpec } from "./spec.ts";
import { generateEmitRunners } from "./runner/index.ts";
import * as path from "path";
import * as fs from "fs";

export type ScalarType = 'string' | 'boolean' | 'int8' | 'int16' | 'int32' | 'int64' | 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'float32' | 'float64' | 'bytes';

export interface FieldDef {
  name: string;
  type: ScalarType | string;
  optional?: boolean;
  isArray?: boolean;
  isModel?: boolean;
}

export interface ModelDef {
  name: string;
  fields: FieldDef[];
  recursive?: boolean;
}

export const SCALARS: ScalarType[] = ['string', 'boolean', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'bytes'];

export const models: Record<string, ModelDef> = {};
export const modelOrder: string[] = [];

// Parse TypeSpec model to FieldDef
function parseField(prop: any): FieldDef {
  const type = prop.type;
  let typeName: string;
  let isArray = false;
  let isModel = false;
  
  if (type.kind === "Scalar") {
    typeName = type.name;
  } else if (type.kind === "Model") {
    if (type.indexer) {
      isArray = true;
      const elemType = type.indexer.value;
      if (elemType.kind === "Scalar") {
        typeName = elemType.name;
      } else if (elemType.kind === "Model" && elemType.name) {
        typeName = elemType.name;
        isModel = true;
      } else {
        typeName = "string";
      }
    } else if (type.name) {
      typeName = type.name;
      isModel = true;
    } else {
      typeName = "string";
    }
  } else {
    typeName = "string";
  }
  
  return {
    name: prop.name,
    type: typeName,
    optional: prop.optional ?? false,
    isArray,
    isModel
  };
}

// Load models from TypeSpec spec file
async function loadModelsFromSpec(specPath: string): Promise<void> {
  const specFile = path.resolve(specPath);
  
  // Compile TypeSpec spec
  const p = await program.compile(specFile, {
    emitters: [], // Don't run any emitters
    outputDir: "/tmp/tsp-load-models"
  });
  
  if (p.hasError()) {
    console.error("TypeSpec compilation failed");
    process.exit(1);
  }
  
  // Navigate all models in the global namespace
  const globalNs = p.getGlobalNamespaceType();
  
  function collectModels(ns: Namespace) {
    navigateTypesInNamespace(ns, {
      model: (m: Model) => {
        if (!m.name || models[m.name]) return;
        
        const fields: FieldDef[] = [];
        for (const [name, prop] of m.properties) {
          fields.push(parseField(prop));
        }
        
        models[m.name] = { name: m.name, fields };
        modelOrder.push(m.name);
      }
    });
    
    // Also check sub-namespaces
    for (const [, subNs] of ns.namespaces) {
      collectModels(subNs);
    }
  }
  
  collectModels(globalNs);
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let stage = "all";
  let langs = ["ts", "py", "rust", "go", "kotlin", "dart", "swift"];
  let specPath = "../../specs/alltypes.tsp";
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--stage") {
      stage = args[++i];
    } else if (args[i] === "--lang") {
      langs = args[++i].split(",");
    } else if (args[i] === "--spec") {
      specPath = args[++i];
    }
  }
  
  console.log("══════════════════════════════════════");
  console.log("Specodec Test Generator");
  console.log(`Stage: ${stage}`);
  console.log(`Languages: ${langs.join(", ")}`);
  console.log("══════════════════════════════════════");
  
  // Load models from TypeSpec spec
  if (stage === "all" || stage === "spec") {
    console.log("\nStage 0: Loading models from TypeSpec spec...");
    await loadModelsFromSpec(specPath);
    console.log(`Loaded ${modelOrder.length} models from ${specPath}`);
  } else {
    // For other stages, try to load from existing vectors/manifest.json
    const manifestPath = "vectors/manifest.json";
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      for (const [name, def] of Object.entries(manifest.models || {})) {
        if (name === "TypeSpec") continue; // Skip TypeSpec internal models
        models[name] = def as ModelDef;
        modelOrder.push(name);
      }
      console.log(`Loaded ${modelOrder.length} models from manifest`);
    } else {
      console.error("No manifest.json found. Run with --stage all first.");
      process.exit(1);
    }
  }
  
  const SUB_MODELS = modelOrder.filter(n => models[n].fields.every(f => !f.isModel || modelOrder.includes(f.type)));
  const testModels = modelOrder.filter(n => !SUB_MODELS.includes(n) || models[n].fields.some(f => f.isModel));
  
  console.log(`Total models: ${modelOrder.length}`);
  console.log(`Test models: ${testModels.length}`);
  
  // Generate vectors
  if (stage === "all" || stage === "vectors") {
    console.log("\nStage 1: Generating test vectors...");
    generateVectors(testModels, SUB_MODELS);
  }
  
  // Generate TypeSpec spec (for emitters)
  if (stage === "all" || stage === "spec") {
    console.log("\nStage 2: Generating TypeSpec spec...");
    const specFile = generateSpec(models, modelOrder);
    console.log(`  Wrote ${specFile}`);
  }
  
  // Generate emit runners
  if (stage === "all" || stage === "emit") {
    console.log("\nStage 3: Generating emit runners...");
    for (const lang of langs) {
      console.log(`  ${lang}: dump + runner`);
    }
    generateEmitRunners(langs, testModels, models);
  }
  
  console.log("\nDone.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});