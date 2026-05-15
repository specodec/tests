import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { models, modelOrder, enums, enumOrder, unions, unionOrder } from "./definitions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPECS = __dirname.endsWith("/gen") ? path.dirname(__dirname) : __dirname;

function tspType(type, opts = {}) {
  if (opts.isArray) return tspType(type) + "[]";
  return type;
}

function emitModelTSP(name, indent) {
  const m = models[name];
  let s = '';
  s += `${indent}@codec\n${indent}model ${name} {\n`;
  for (const field of m.fields) {
    const opt = field.optional ? "?" : "";
    const t = tspType(field.type, field);
    s += `${indent}  ${field.name}${opt}: ${t};\n`;
  }
  s += `${indent}}\n\n`;
  return s;
}

function emitEnumTSP(name, indent) {
  const e = enums[name];
  let s = `${indent}@codec\n${indent}enum ${name} {\n`;
  for (const m of e.members) {
    s += `${indent}  ${m.name},\n`;
  }
  s += `${indent}}\n\n`;
  return s;
}

function emitUnionTSP(name, indent) {
  const u = unions[name];
  let s = `${indent}@codec\n${indent}union ${name} {\n`;
  for (const vr of u.variants) {
    s += `${indent}  ${vr.name}: ${vr.type},\n`;
  }
  s += `${indent}}\n\n`;
  return s;
}

export function emitTSP() {
  const nsModels = {};
  for (const name of modelOrder) {
    const ns = models[name].namespace;
    if (!nsModels[ns]) nsModels[ns] = [];
    nsModels[ns].push(name);
  }
  const nsEnums = {};
  for (const name of enumOrder) {
    const ns = enums[name].namespace;
    if (!nsEnums[ns]) nsEnums[ns] = [];
    nsEnums[ns].push(name);
  }
  const nsUnions = {};
  for (const name of unionOrder) {
    const ns = unions[name].namespace;
    if (!nsUnions[ns]) nsUnions[ns] = [];
    nsUnions[ns].push(name);
  }

  const allNamespaces = new Set([...Object.keys(nsModels), ...Object.keys(nsEnums), ...Object.keys(nsUnions)]);
  const ID = (d) => "  ".repeat(d);

  function emitNS(ns, depth) {
    const parts = ns.split(".");
    if (depth > parts.length) return "";
    if (depth === parts.length) {
      let s = "";
      const indent = ID(depth);
      for (const en of (nsEnums[ns] || [])) s += emitEnumTSP(en, indent);
      for (const mn of (nsModels[ns] || [])) s += emitModelTSP(mn, indent);
      for (const un of (nsUnions[ns] || [])) s += emitUnionTSP(un, indent);
      return s;
    }
    const name = parts[depth];
    const isLast = depth === parts.length - 1;
    if (!isLast) return `${ID(depth)}namespace ${name} {\n${emitNS(ns, depth + 1)}${ID(depth)}}\n`;
    let s = `${ID(depth)}namespace ${name} {\n`;
    s += emitNS(ns, depth + 1);
    s += `${ID(depth)}}\n`;
    return s;
  }

  let out = 'import "@specodec/typespec-emitter-core";\n\nusing Specodec;\n\nnamespace AllTypes {\n';
  for (const ns of [...allNamespaces].sort()) {
    out += emitNS(ns, 1);
  }
  out += "}\n";

  const tspPath = path.join(SPECS, "alltypes.tsp");
  fs.writeFileSync(tspPath, out);
  console.log(`Wrote ${tspPath}`);
}
