import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  MsgPackWriter, MsgPackReader,
  JsonWriter, JsonReader,
  GronWriter, GronReader,
} from "@specodec/specodec-ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VEC = path.join(__dirname, "vectors");
const OUT = path.join(__dirname, "output_ts");
fs.mkdirSync(path.join(OUT, "scalars"), { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(VEC, "manifest.json"), "utf-8"));
const schema = JSON.parse(fs.readFileSync(path.join(VEC, "typeschema.json"), "utf-8"));
const results = { scalars: {}, objects: {} };

function tryScalar(name, fn) {
  try {
    fn();
    results.scalars[name] = { pass: true };
  } catch (e) {
    results.scalars[name] = { pass: false, error: e.message };
    console.error(`  FAIL ${name}: ${e.message}`);
  }
}

// ═══════════════════════════════════
// 1. Scalar MsgPack round-trips
// ═══════════════════════════════════
console.log("TS: processing scalars...");

for (const [name, spec] of Object.entries(manifest.scalars)) {
  const refBuf = new Uint8Array(fs.readFileSync(path.join(VEC, "scalars", name + ".mp")));
  const w = new MsgPackWriter();

  switch (spec.type) {
    case "int32": tryScalar(name, () => { w.writeInt32(new MsgPackReader(refBuf).readInt32()); }); break;
    case "int64": tryScalar(name, () => { w.writeInt64(new MsgPackReader(refBuf).readInt64()); }); break;
    case "uint32": tryScalar(name, () => { w.writeUint32(new MsgPackReader(refBuf).readUint32()); }); break;
    case "uint64": tryScalar(name, () => { w.writeUint64(new MsgPackReader(refBuf).readUint64()); }); break;
    case "float32": tryScalar(name, () => { w.writeFloat32(new MsgPackReader(refBuf).readFloat32()); }); break;
    case "float64": tryScalar(name, () => { w.writeFloat64(new MsgPackReader(refBuf).readFloat64()); }); break;
    case "string": tryScalar(name, () => { w.writeString(new MsgPackReader(refBuf).readString()); }); break;
    case "bytes": tryScalar(name, () => { w.writeBytes(new MsgPackReader(refBuf).readBytes()); }); break;
    case "bool": tryScalar(name, () => { w.writeBool(new MsgPackReader(refBuf).readBool()); }); break;
  }

  if (results.scalars[name]?.pass) {
    fs.writeFileSync(path.join(OUT, "scalars", name + ".mp"), w.toBytes());
  }
}

// ═══════════════════════════════════
// 2. Generic schema-driven decode/encode
// ═══════════════════════════════════

function readScalar(r, type) {
  switch (type) {
    case "string":  return r.readString();
    case "boolean": return r.readBool();
    case "int8": case "int16": case "int32": return r.readInt32();
    case "int64":   return r.readInt64();
    case "uint8": case "uint16": case "uint32": return r.readUint32();
    case "uint64":  return r.readUint64();
    case "float32": return r.readFloat32();
    case "float64": return r.readFloat64();
    case "bytes":   return r.readBytes();
    default: throw new Error(`unknown scalar: ${type}`);
  }
}

function writeScalarMP(w, val, type) {
  switch (type) {
    case "string":  w.writeString(val); break;
    case "boolean": w.writeBool(val); break;
    case "int8": case "int16": case "int32": w.writeInt32(val); break;
    case "int64":   w.writeInt64(val); break;
    case "uint8": case "uint16": case "uint32": w.writeUint32(val); break;
    case "uint64":  w.writeUint64(val); break;
    case "float32": w.writeFloat32(val); break;
    case "float64": w.writeFloat64(val); break;
    case "bytes":   w.writeBytes(val); break;
  }
}

function decodeField(r, field) {
  if (field.optional && r.isNull()) {
    r.readNull();
    return null;
  }
  if (field.isArray) {
    const arr = [];
    r.beginArray();
    while (r.hasNextElement()) {
      if (typeof r.nextElement === "function") r.nextElement();
      if (field.isModel) arr.push(decodeModel(r, field.type));
      else arr.push(readScalar(r, field.type));
    }
    r.endArray();
    return arr;
  }
  if (field.isModel) return decodeModel(r, field.type);
  return readScalar(r, field.type);
}

function decodeModel(r, modelName) {
  const s = schema[modelName];
  const o = {};
  r.beginObject();
  while (r.hasNextField()) {
    const k = r.readFieldName();
    const field = s.fields.find(f => f.name === k);
    if (field) o[k] = decodeField(r, field);
    else r.skip();
  }
  r.endObject();
  return o;
}

function encodeModelMP(o, modelName) {
  const w = new MsgPackWriter();
  encodeModelInlineMP(w, o, modelName);
  return w.toBytes();
}

function encodeModelInlineMP(w, o, modelName) {
  const s = schema[modelName];
  let count = 0;
  for (const field of s.fields) {
    if (field.optional && (o[field.name] === undefined || o[field.name] === null)) continue;
    count++;
  }
  w.beginObject(count);
  for (const field of s.fields) {
    if (field.optional && (o[field.name] === undefined || o[field.name] === null)) continue;
    w.writeField(field.name);
    encodeFieldMP(w, o[field.name], field);
  }
  w.endObject();
}

function encodeFieldMP(w, val, field) {
  if (field.optional && val === null) { w.writeNull(); return; }
  if (field.isArray) {
    w.beginArray(val.length);
    for (const item of val) {
      if (field.isModel) encodeModelInlineMP(w, item, field.type);
      else writeScalarMP(w, item, field.type);
    }
    w.endArray();
    return;
  }
  if (field.isModel) { encodeModelInlineMP(w, val, field.type); return; }
  writeScalarMP(w, val, field.type);
}

function encodeModelJSON(o, modelName) {
  const s = schema[modelName];
  const w = new JsonWriter();
  w.beginObject();
  for (const field of s.fields) {
    if (field.optional && (o[field.name] === undefined || o[field.name] === null)) continue;
    w.writeField(field.name);
    encodeFieldJSON(w, o[field.name], field);
  }
  w.endObject();
  return w.toBytes();
}

function encodeFieldJSON(w, val, field) {
  if (field.optional && val === null) { w.writeNull(); return; }
  if (field.isArray) {
    w.beginArray();
    for (const item of val) {
      w.nextElement();
      if (field.isModel) encodeModelInlineJSON(w, item, field.type);
      else writeScalarJSON(w, item, field.type);
    }
    w.endArray();
    return;
  }
  if (field.isModel) { encodeModelInlineJSON(w, val, field.type); return; }
  writeScalarJSON(w, val, field.type);
}

function encodeModelInlineJSON(w, o, modelName) {
  const s = schema[modelName];
  w.beginObject();
  for (const field of s.fields) {
    if (field.optional && (o[field.name] === undefined || o[field.name] === null)) continue;
    w.writeField(field.name);
    encodeFieldJSON(w, o[field.name], field);
  }
  w.endObject();
}

function writeScalarJSON(w, val, type) { writeScalarMP(w, val, type); }

function encodeModelGron(o, modelName) {
  const s = schema[modelName];
  const w = new GronWriter();
  w.beginObject(countFields(s, o));
  for (const field of s.fields) {
    if (field.optional && (o[field.name] === undefined || o[field.name] === null)) continue;
    w.writeField(field.name);
    encodeFieldGron(w, o[field.name], field);
  }
  w.endObject();
  return w.toBytes();
}

function countFields(s, o) {
  let c = 0;
  for (const f of s.fields) { if (!f.optional || o[f.name] !== undefined) c++; }
  return c;
}

function encodeFieldGron(w, val, field) {
  if (field.optional && val === null) { w.writeNull(); return; }
  if (field.isArray) {
    w.beginArray(val.length);
    for (const item of val) {
      w.nextElement();
      if (field.isModel) encodeModelInlineGron(w, item, field.type);
      else writeScalarGron(w, item, field.type);
    }
    w.endArray();
    return;
  }
  if (field.isModel) { encodeModelInlineGron(w, val, field.type); return; }
  writeScalarGron(w, val, field.type);
}

function encodeModelInlineGron(w, o, modelName) {
  const s = schema[modelName];
  w.beginObject(countFields(s, o));
  for (const field of s.fields) {
    if (field.optional && (o[field.name] === undefined || o[field.name] === null)) continue;
    w.writeField(field.name);
    encodeFieldGron(w, o[field.name], field);
  }
  w.endObject();
}

function writeScalarGron(w, val, type) { writeScalarMP(w, val, type); }

// ═══════════════════════════════════
// 3. Object round-trips
// ═══════════════════════════════════
console.log("TS: processing objects...");

for (const name of manifest.testModels) {
  results.objects[name] = { mp: null, json: null, unformattedJson: null, gron: null };

  // MsgPack
  try {
    const refBuf = fs.readFileSync(path.join(VEC, name + ".msgpack"));
    const decoded = decodeModel(new MsgPackReader(new Uint8Array(refBuf)), name);
    const encoded = encodeModelMP(decoded, name);
    fs.writeFileSync(path.join(OUT, name + ".msgpack"), encoded);
    results.objects[name].mp = true;
  } catch (e) {
    results.objects[name].mp = false;
    console.error(`  FAIL ${name}.msgpack: ${e.message}`);
  }

  // JSON (compact)
  let compactEncoded;
  try {
    const refBuf = fs.readFileSync(path.join(VEC, name + ".json"));
    const decoded = decodeModel(new JsonReader(new Uint8Array(refBuf)), name);
    compactEncoded = encodeModelJSON(decoded, name);
    fs.writeFileSync(path.join(OUT, name + ".json"), compactEncoded);
    results.objects[name].json = true;
  } catch (e) {
    results.objects[name].json = false;
    console.error(`  FAIL ${name}.json: ${e.message}`);
  }

  // Unformatted JSON (decode from unformatted → re-encode compact → compare with compact output)
  try {
    const unformattedBuf = fs.readFileSync(path.join(VEC, name + ".unformatted.json"));
    const decoded = decodeModel(new JsonReader(new Uint8Array(unformattedBuf)), name);
    const unformattedEncoded = encodeModelJSON(decoded, name);
    if (compactEncoded && Buffer.from(unformattedEncoded).equals(compactEncoded)) {
      results.objects[name].unformattedJson = true;
    } else if (compactEncoded) {
      results.objects[name].unformattedJson = false;
      console.error(`  FAIL ${name}.unformatted.json: re-encoded bytes differ`);
    } else {
      results.objects[name].unformattedJson = false;
    }
  } catch (e) {
    results.objects[name].unformattedJson = false;
    console.error(`  FAIL ${name}.unformatted.json: ${e.message}`);
  }

  // Gron
  try {
    const gronBuf = fs.readFileSync(path.join(VEC, name + ".gron"));
    const gronReader = new GronReader(new Uint8Array(gronBuf));
    const decoded = decodeModel(gronReader, name);
    const encoded = encodeModelGron(decoded, name);
    fs.writeFileSync(path.join(OUT, name + ".gron"), encoded);
    results.objects[name].gron = true;
  } catch (e) {
    results.objects[name].gron = false;
    console.error(`  FAIL ${name}.gron: ${e.message}`);
  }
}

// Write results
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
const totalPass = Object.values(results.scalars).filter(r => r.pass).length
  + Object.values(results.objects).filter(r => r.mp === true && r.json === true && r.unformattedJson === true && r.gron === true).length;
const totalFail = Object.values(results.scalars).filter(r => !r.pass).length
  + Object.values(results.objects).filter(r => r.mp !== true || r.json !== true || r.unformattedJson !== true || r.gron !== true).length;
console.log(`TS done: ${totalPass} passed, ${totalFail} failed`);
if (totalFail > 0) process.exit(1);
