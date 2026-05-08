import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { encode as mpEncode } from "@msgpack/msgpack";
import { MsgPackWriter } from "@specodec/specodec-ts";
import { models, modelOrder, enums, enumOrder, unions, unionOrder, testModels } from "./definitions.mjs";
import { scalarValue, getInstance } from "./instance.mjs";
import {
  specodecJson, specodecGron, specodecMsgPack,
  specodecUnionJson, specodecUnionGron, specodecUnionMsgPack,
  randomFormatJson
} from "./encoding.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPECS = __dirname.endsWith("/gen") ? path.dirname(__dirname) : __dirname;
const VEC = path.join(SPECS, "vectors");
const mpOpts = { useBigInt64: true };

fs.mkdirSync(path.join(VEC, "scalars"), { recursive: true });

// ═══════════════════════════════════════════
// Scalar test vectors
// ═══════════════════════════════════════════

const scalars = {
  "int8_min":    { value: -128,                    type: "int32" },
  "int8_max":    { value: 127,                     type: "int32" },
  "int16_min":   { value: -32768,                  type: "int32" },
  "int16_max":   { value: 32767,                   type: "int32" },
  "int32_min":   { value: -2147483648,             type: "int32" },
  "int32_max":   { value: 2147483647,              type: "int32" },
  "int64_min":   { value: BigInt("-9223372036854775808"), type: "int64" },
  "int64_max":   { value: BigInt("9223372036854775807"),  type: "int64" },
  "uint8_max":   { value: 255,                     type: "uint32" },
  "uint16_max":  { value: 65535,                   type: "uint32" },
  "uint32_max":  { value: 4294967295,              type: "uint32" },
  "uint64_max":  { value: BigInt("18446744073709551615"), type: "uint64" },
  "float32_1.5": { value: 1.5,                     type: "float32" },
  "float32_neg_zero": { value: -0.0,               type: "float32" },
  "float32_inf":      { value: Infinity,            type: "float32" },
  "float32_neg_inf":  { value: -Infinity,           type: "float32" },
  "float32_nan":      { value: NaN,                 type: "float32" },
  "float64_pi":  { value: 3.14159265358979,        type: "float64" },
  "float64_neg_zero": { value: -0.0,               type: "float64" },
  "float64_inf":      { value: Infinity,            type: "float64" },
  "float64_neg_inf":  { value: -Infinity,           type: "float64" },
  "float64_nan":      { value: NaN,                 type: "float64" },
  "str_empty":   { value: "",                      type: "string" },
  "str_ascii":   { value: "hello",                 type: "string" },
  "str_null_byte": { value: "a\x00b",              type: "string" },
  "str_escape":  { value: "a\nb\tc\"d\\e",         type: "string" },
  "str_unicode": { value: "你好世界🌍",            type: "string" },
  "str_31":      { value: "x".repeat(31),           type: "string" },
  "str_32":      { value: "x".repeat(32),           type: "string" },
  "str_255":     { value: "x".repeat(255),          type: "string" },
  "str_256":     { value: "x".repeat(256),          type: "string" },
  "bytes_empty": { value: Buffer.alloc(0),          type: "bytes" },
  "bytes_small": { value: Buffer.from([0, 1, 127, 255]), type: "bytes" },
  "bytes_31":    { value: Buffer.alloc(31, 0x42),   type: "bytes" },
  "bytes_32":    { value: Buffer.alloc(32, 0x42),   type: "bytes" },
  "bytes_255":   { value: Buffer.alloc(255, 0x42),  type: "bytes" },
  "bytes_256":   { value: Buffer.alloc(256, 0x42),  type: "bytes" },
  "bytes_zeros": { value: Buffer.alloc(64, 0x00),   type: "bytes" },
  "bytes_ff":    { value: Buffer.alloc(64, 0xFF),   type: "bytes" },
  "bool_true":   { value: true,                     type: "bool" },
  "bool_false":  { value: false,                    type: "bool" },
};

function encodeScalar(value, type) {
  if (type === "float32") {
    const buf = Buffer.allocUnsafe(5);
    buf[0] = 0xCA;
    new DataView(buf.buffer, buf.byteOffset, buf.byteLength).setFloat32(1, value, false);
    return buf;
  }
  if (type === "float64") {
    const buf = Buffer.allocUnsafe(9);
    buf[0] = 0xCB;
    new DataView(buf.buffer, buf.byteOffset, buf.byteLength).setFloat64(1, value, false);
    return buf;
  }
  const w = new MsgPackWriter();
  switch (type) {
    case "string": w.writeString(value); break;
    case "boolean": w.writeBool(value); break;
    case "int8": case "int16": case "int32": case "integer": w.writeInt32(value); break;
    case "int64": w.writeInt64(BigInt(value)); break;
    case "uint8": case "uint16": case "uint32": w.writeUint32(value); break;
    case "uint64": w.writeUint64(BigInt(value)); break;
    case "bytes": w.writeBytes(new Uint8Array(value)); break;
    default: return mpEncode(value, mpOpts);
  }
  return w.toBytes();
}

for (const [name, { value, type }] of Object.entries(scalars)) {
  fs.writeFileSync(path.join(VEC, "scalars", name + ".mp"), encodeScalar(value, type));
}

// ═══════════════════════════════════════════
// Object test vectors
// ═══════════════════════════════════════════

const objects = {};
for (const name of testModels) {
  objects[name] = getInstance(name);
}

for (const [name, data] of Object.entries(objects)) {
  fs.writeFileSync(path.join(VEC, name + ".json"), specodecJson(data, name));
  fs.writeFileSync(path.join(VEC, name + ".unformatted.json"), randomFormatJson(data));
  fs.writeFileSync(path.join(VEC, name + ".gron"), specodecGron(data, name));
  fs.writeFileSync(path.join(VEC, name + ".msgpack"), specodecMsgPack(data, name));
}

// ═══════════════════════════════════════════
// Union test vectors
// ═══════════════════════════════════════════

const testUnions = [];
const unionTestData = {};
for (const uname of unionOrder) {
  const u = unions[uname];
  for (const vr of u.variants) {
    const testKey = `${uname}_${vr.name}`;
    testUnions.push(testKey);
    let val;
    if (vr.isScalar) {
      val = scalarValue(vr.type, 1);
    } else if (models[vr.type]) {
      val = getInstance(vr.type);
    } else if (unions[vr.type]) {
      const nestedU = unions[vr.type];
      const nestedVr = nestedU.variants[0];
      let nestedVal;
      if (nestedVr.isScalar) {
        nestedVal = scalarValue(nestedVr.type, 1);
      } else {
        nestedVal = getInstance(nestedVr.type);
      }
      val = { [nestedVr.name]: nestedVal };
    }
    const unionData = { [vr.name]: val };
    unionTestData[testKey] = { union: uname, variant: vr.name, data: unionData };
  }
}

for (const [name, { union: uname, data }] of Object.entries(unionTestData)) {
  fs.writeFileSync(path.join(VEC, name + ".json"), specodecUnionJson(data, uname));
  fs.writeFileSync(path.join(VEC, name + ".unformatted.json"), randomFormatJson(data));
  fs.writeFileSync(path.join(VEC, name + ".gron"), specodecUnionGron(data, uname));
  fs.writeFileSync(path.join(VEC, name + ".msgpack"), specodecUnionMsgPack(data, uname));
}

// ═══════════════════════════════════════════
// Manifest
// ═══════════════════════════════════════════

const manifest = { scalars: {}, objects: {}, testModels, modelNamespaces: {}, enums: {}, unions: {}, testUnions };
for (const name of testModels) manifest.modelNamespaces[name] = models[name].namespace;

for (const name of enumOrder) {
  manifest.enums[name] = { members: enums[name].members, namespace: enums[name].namespace };
}
for (const name of unionOrder) {
  manifest.unions[name] = { variants: unions[name].variants.map(v => ({ name: v.name, type: v.type, isScalar: v.isScalar })), namespace: unions[name].namespace };
}

for (const [name, { value, type }] of Object.entries(scalars)) {
  manifest.scalars[name] = {
    type,
    value: typeof value === "bigint" ? value.toString() : Buffer.isBuffer(value) ? value.toString("base64") : Object.is(value, -0.0) ? -0.0 : (typeof value === "number" && !isFinite(value)) ? String(value) : value,
    valueType: typeof value === "bigint" ? "bigint" : Buffer.isBuffer(value) ? "bytes" : typeof value,
  };
}

for (const [name, data] of Object.entries(objects)) {
  manifest.objects[name] = JSON.parse(JSON.stringify(data, (key, val) => {
    if (typeof val === "bigint") return { __type: "bigint", __value: val.toString() };
    if (Buffer.isBuffer(val)) return { __type: "bytes", __value: val.toString("base64") };
    return val;
  }));
}

fs.writeFileSync(path.join(VEC, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`Generated:`);
console.log(`  scalars: ${Object.keys(scalars).length} files`);
console.log(`  objects: ${Object.keys(objects).length} pairs (json+msgpack)`);
console.log(`  models:  ${modelOrder.length} total, ${testModels.length} test vectors`);
console.log(`  unions:  ${unionOrder.length} unions, ${testUnions.length} test vectors`);
console.log(`  enums:   ${enumOrder.length} enums`);
console.log(`Done.`);
