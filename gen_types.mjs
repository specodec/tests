import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { encode as mpEncode, decode as mpDecode } from "@msgpack/msgpack";
import { JsonWriter, GronWriter } from "@specodec/specodec-ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mpOpts = { useBigInt64: true };
const BASE = __dirname;
const VEC = path.join(BASE, "vectors");
const SPECS = BASE;

fs.mkdirSync(path.join(VEC, "scalars"), { recursive: true });

const SCALARS = ["string","boolean","int8","int16","int32","int64",
                 "uint8","uint16","uint32","uint64","float32","float64","bytes"];

const models = {};
const modelOrder = [];

function addM(name, fields, opts = {}) {
  if (models[name]) throw new Error(`duplicate model: ${name}`);
  models[name] = { name, fields, recursive: !!opts.recursive };
  modelOrder.push(name);
}

function f(name, type, extra = {}) {
  return { name, type, ...extra };
}

addM("Inner",   [f("x","int32"), f("y","int32")]);
addM("Coord",   [f("lat","float64"), f("lng","float64")]);
addM("IdVal",   [f("id","string"), f("value","int32")]);
addM("Label",   [f("key","string"), f("text","string")]);
addM("Money",   [f("amount","int64"), f("currency","string")]);
addM("Range32", [f("min","int32"), f("max","int32")]);
addM("Addr",    [f("street","string"), f("city","string"), f("zip","string")]);
addM("Point3",  [f("x","float64"), f("y","float64"), f("z","float64")]);
addM("OptInner",[f("name","string",{optional:true}), f("score","float64",{optional:true}), f("tag","string",{optional:true})]);

const SUB_MODELS = ["Inner","Coord","IdVal","Label","Money","Range32","Addr","Point3"];

for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM("Single" + cap, [f("v", sc)]);
}

for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM("OptSingle" + cap, [f("v", sc, { optional: true })]);
}

for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM("Pair" + cap, [f("a", sc), f("b", sc)]);
}

const DPAIRS = [
  ["string","int32"],["string","boolean"],["string","float64"],["string","bytes"],
  ["int32","boolean"],["int32","float64"],["int32","int64"],["int32","uint32"],
  ["int64","uint64"],["float32","float64"],["float64","boolean"],["float64","bytes"],
  ["uint32","uint64"],["boolean","bytes"],["int8","uint8"],["int16","uint16"],
  ["string","int64"],["string","uint64"],["int32","bytes"],["float64","int32"],
  ["boolean","int32"],["bytes","int64"],["int8","float32"],["uint8","int16"],
  ["int64","float64"],["uint64","string"]
];
for (let i = 0; i < DPAIRS.length; i++) {
  const [t1, t2] = DPAIRS[i];
  const cap1 = t1.charAt(0).toUpperCase() + t1.slice(1);
  const cap2 = t2.charAt(0).toUpperCase() + t2.slice(1);
  addM(`Dual${cap1}${cap2}`, [f("a", t1), f("b", t2)]);
}

const TRIPLES = [
  ["string","int32","boolean"],
  ["float64","float64","float64"],
  ["int32","int32","int32"],
  ["string","string","int32"],
  ["int64","string","boolean"],
  ["uint32","uint64","string"],
  ["bytes","string","int32"],
  ["float32","int32","boolean"],
  ["string","int64","float64"],
  ["boolean","boolean","boolean"],
  ["int8","int16","int32"],
  ["uint8","uint16","uint32"],
  ["string","bytes","float64"],
  ["int64","uint64","boolean"],
  ["float64","string","bytes"]
];
for (let i = 0; i < TRIPLES.length; i++) {
  const types = TRIPLES[i];
  const fields = types.map((t, j) => f(String.fromCharCode(97 + j), t));
  addM("Triple" + String(i + 1).padStart(2, "0"), fields);
}

const QUINCS = [
  ["string","int32","boolean","float64","bytes"],
  ["int32","int32","int32","int32","int32"],
  ["string","string","string","string","string"],
  ["float64","int32","string","boolean","bytes"],
  ["int64","uint64","string","float32","int32"],
  ["boolean","string","int32","float64","uint32"],
  ["bytes","bytes","string","int32","float64"],
  ["uint8","uint16","uint32","int8","int16"],
  ["float32","float64","int32","int64","string"],
  ["string","boolean","int64","uint64","float64"]
];
for (let i = 0; i < QUINCS.length; i++) {
  const types = QUINCS[i];
  const fields = types.map((t, j) => f("f" + (j + 1), t));
  addM("Five" + String(i + 1).padStart(2, "0"), fields);
}

for (let g = 0; g < 5; g++) {
  const fields = [];
  for (let j = 0; j < 10; j++) {
    fields.push(f("f" + (j + 1), SCALARS[(g * 3 + j) % SCALARS.length]));
  }
  addM("Ten" + String(g + 1).padStart(2, "0"), fields);
}

const ARR_SCALARS = ["string","int32","boolean","float64","bytes","int64","uint64"];
for (const sc of ARR_SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM("Arr" + cap, [f("items", sc, { isArray: true })]);
}

addM("MultiArr1", [f("names","string",{isArray:true}), f("scores","int32",{isArray:true})]);
addM("MultiArr2", [f("flags","boolean",{isArray:true}), f("values","float64",{isArray:true}), f("payload","bytes",{isArray:true})]);
addM("MultiArr3", [f("a","string",{isArray:true}), f("b","int32",{isArray:true}), f("c","float64",{isArray:true})]);
addM("MultiArr4", [f("ids","int64",{isArray:true}), f("tags","string",{isArray:true})]);
addM("MultiArr5", [f("xs","uint64",{isArray:true}), f("ys","float32",{isArray:true}), f("zs","boolean",{isArray:true})]);

addM("OptCombo1", [f("req","string"), f("opt_a","int32",{optional:true})]);
addM("OptCombo2", [f("req","string"), f("opt_a","int32",{optional:true}), f("opt_b","boolean",{optional:true})]);
addM("OptCombo3", [f("req","string"), f("opt_a","int32",{optional:true}), f("opt_b","boolean",{optional:true}), f("opt_c","float64",{optional:true})]);
addM("OptCombo4", [f("req","int32"), f("opt_a","string",{optional:true}), f("opt_b","bytes",{optional:true})]);
addM("OptCombo5", [f("req1","string"), f("req2","int32"), f("opt_a","boolean",{optional:true}), f("opt_b","float64",{optional:true})]);
addM("OptCombo6", [f("req","string"), f("opt_s","string",{optional:true}), f("opt_i","int32",{optional:true}), f("opt_f","float64",{optional:true}), f("opt_b","bytes",{optional:true})]);
addM("OptCombo7", [f("req","int64"), f("opt_u64","uint64",{optional:true}), f("opt_str","string",{optional:true})]);
addM("OptCombo8", [f("a","string"), f("b","int32",{optional:true}), f("c","float64",{optional:true}), f("d","boolean",{optional:true}), f("e","bytes",{optional:true}), f("f","int64",{optional:true})]);
addM("OptCombo9", [f("id","string"), f("name","string",{optional:true}), f("age","int32",{optional:true}), f("score","float64",{optional:true})]);
addM("OptCombo10", [f("code","int32"), f("msg","string",{optional:true}), f("detail","string",{optional:true}), f("retry","boolean",{optional:true})]);

for (const sub of SUB_MODELS) {
  addM("Nest" + sub, [f("nested", sub, { isModel: true })]);
}

for (const sub of SUB_MODELS) {
  addM("OptNest" + sub, [f("label","string"), f("nested", sub, { optional: true, isModel: true })]);
}

addM("ModelArr1", [f("points","Inner",{isArray:true,isModel:true})]);
addM("ModelArr2", [f("coords","Coord",{isArray:true,isModel:true})]);
addM("ModelArr3", [f("items","IdVal",{isArray:true,isModel:true}), f("tag","string")]);
addM("ModelArr4", [f("labels","Label",{isArray:true,isModel:true}), f("count","int32")]);
addM("ModelArr5", [f("arr","Money",{isArray:true,isModel:true}), f("bs","Addr",{isArray:true,isModel:true})]);

addM("Mix01", [f("name","string"), f("value","int32"), f("point","Inner",{isModel:true})]);
addM("Mix02", [f("id","string"), f("loc","Coord",{isModel:true}), f("tags","string",{isArray:true})]);
addM("Mix03", [f("label","string"), f("value_range","Range32",{isModel:true}), f("active","boolean")]);
addM("Mix04", [f("title","string"), f("price","Money",{isModel:true}), f("inStock","boolean"), f("rating","float64")]);
addM("Mix05", [f("addr","Addr",{isModel:true}), f("coords","Coord",{isArray:true,isModel:true})]);
addM("Mix06", [f("name","string"), f("age","int32"), f("address","Addr",{optional:true,isModel:true}), f("email","string",{optional:true})]);
addM("Mix07", [f("origin","Point3",{isModel:true}), f("dest","Point3",{isModel:true}), f("distance","float64")]);
addM("Mix08", [f("keys","string",{isArray:true}), f("values","int32",{isArray:true}), f("meta","Label",{optional:true,isModel:true})]);
addM("Mix09", [f("id","int64"), f("payload","bytes"), f("checksum","uint32"), f("prev","IdVal",{optional:true,isModel:true})]);
addM("Mix10", [f("items","string",{isArray:true}), f("total","int32"), f("avg","float64"), f("value_range","Range32",{isModel:true})]);
addM("Mix11", [f("name","string"), f("values","float64",{isArray:true}), f("nested","Inner",{optional:true,isModel:true}), f("flag","boolean",{optional:true})]);
addM("Mix12", [f("header","string"), f("entries","IdVal",{isArray:true,isModel:true}), f("footer","string",{optional:true})]);
addM("Mix13", [f("a","int32"), f("b","float64"), f("c","string"), f("d","boolean"), f("e","bytes"), f("nested","Inner",{isModel:true})]);
addM("Mix14", [f("amounts","Money",{isArray:true,isModel:true}), f("total","int64"), f("currency","string")]);
addM("Mix15", [f("src_addr","Addr",{isModel:true}), f("dst_addr","Addr",{isModel:true}), f("distance","float64"), f("duration","float64")]);

addM("AllOpt1", [f("a","string",{optional:true}), f("b","int32",{optional:true}), f("c","boolean",{optional:true})]);
addM("AllOpt2", [f("x","float64",{optional:true}), f("y","bytes",{optional:true}), f("z","int64",{optional:true})]);
addM("AllOpt3", [f("name","string",{optional:true}), f("age","int32",{optional:true}), f("score","float64",{optional:true}), f("active","boolean",{optional:true})]);
addM("AllOpt4", [f("a","uint32",{optional:true}), f("b","uint64",{optional:true}), f("c","int32",{optional:true}), f("d","string",{optional:true}), f("e","bytes",{optional:true})]);
addM("AllOpt5", [f("p","Inner",{optional:true,isModel:true}), f("q","string",{optional:true})]);

addM("RecList",   [f("value","int32"), f("next","RecList",{optional:true,isModel:true})], {recursive:true});
addM("RecTree",   [f("value","string"), f("left_node","RecTree",{optional:true,isModel:true}), f("right_node","RecTree",{optional:true,isModel:true})], {recursive:true});
addM("RecChain",  [f("id","int32"), f("label","string"), f("next","RecChain",{optional:true,isModel:true})], {recursive:true});
addM("RecWrap",   [f("payload","bytes"), f("nested","RecWrap",{optional:true,isModel:true})], {recursive:true});
addM("RecWide",   [f("a","int32"), f("b","string"), f("c","float64"), f("child","RecWide",{optional:true,isModel:true})], {recursive:true});

for (let w = 0; w < 5; w++) {
  const fields = [];
  const n = 20 + w * 5;
  for (let j = 0; j < n; j++) {
    const sc = SCALARS[(w * 7 + j) % SCALARS.length];
    fields.push(f("f" + (j + 1), sc));
  }
  addM("Wide" + String(n), fields);
}

addM("EdgeEmpty", []);
addM("EdgeOneOpt", [f("maybe","string",{optional:true})]);
addM("EdgeBigNums", [f("i8","int8"),f("i16","int16"),f("i32","int32"),f("i64","int64"),f("u8","uint8"),f("u16","uint16"),f("u32","uint32"),f("u64","uint64")]);
addM("EdgeZeroVals", [f("s","string"),f("i","int32"),f("f","float64"),f("b","boolean"),f("by_field","bytes")]);
addM("EdgeNullable", [f("a","string",{optional:true}),f("b","int32",{optional:true}),f("c","Inner",{optional:true,isModel:true}),f("d","string",{isArray:true,optional:true})]);
addM("EdgeNegZero", [f("v","float64")]);
addM("EdgeNullByte", [f("s","string"),f("b","bytes")]);
addM("EdgeBoundary", [f("i32_neg129","int32"),f("i32_128","int32"),f("i32_256","int32"),f("i32_65536","int32"),f("i32_neg32769","int32"),f("u32_65536","uint32")]);
addM("EdgeStrLen", [f("s31","string"),f("s32","string"),f("s255","string"),f("s256","string")]);
addM("EdgeBytesLen", [f("b31","bytes"),f("b32","bytes"),f("b255","bytes"),f("b256","bytes")]);
addM("EdgeArrEmpty", [f("items","string",{isArray:true})]);
addM("EdgeArrBoundary", [f("a15","int32",{isArray:true}),f("a16","int32",{isArray:true})]);

addM("OptArr1", [f("req","string"), f("items","int32",{isArray:true,optional:true})]);
addM("OptArr2", [f("id","int32"), f("names","string",{isArray:true,optional:true}), f("flags","boolean",{isArray:true,optional:true})]);
addM("OptArr3", [f("a","string",{isArray:true,optional:true}), f("b","float64",{isArray:true,optional:true})]);
addM("OptArr4", [f("payload","bytes"), f("chunks","bytes",{isArray:true,optional:true})]);
addM("OptArr5", [f("models","Inner",{isArray:true,isModel:true,optional:true}), f("name","string")]);

addM("NestOpt1", [f("outer","Label",{isModel:true}), f("name","string")]);
addM("NestOpt2", [f("a","IdVal",{optional:true,isModel:true}), f("b","IdVal",{optional:true,isModel:true}), f("c","IdVal",{optional:true,isModel:true})]);
addM("NestOpt3", [f("money","Money",{isModel:true}), f("value_range","Range32",{optional:true,isModel:true})]);
addM("NestOpt4", [f("addr","Addr",{optional:true,isModel:true}), f("coord","Coord",{optional:true,isModel:true}), f("name","string")]);
addM("NestOpt5", [f("point","Point3",{isModel:true}), f("addr","Addr",{isModel:true}), f("label","Label",{optional:true,isModel:true})]);

addM("NestOptInner1", [f("tag","string"), f("nested","OptInner",{optional:true,isModel:true})]);
addM("NestOptInner2", [f("tag","string"), f("nested","OptInner",{isModel:true})]);
addM("NestOptInner3", [f("outer","OptInner",{optional:true,isModel:true}), f("nested","OptInner",{optional:true,isModel:true})]);

addM("DeepNest1", [f("label","string"), f("nested","Addr",{isModel:true})]);
addM("DeepNest2", [f("name","string"), f("money","Money",{isModel:true}), f("addr","Addr",{isModel:true})]);
addM("DeepNest3", [f("title","string"), f("point","Point3",{isModel:true}), f("value_range","Range32",{isModel:true}), f("money","Money",{isModel:true})]);
addM("DeepNest4", [f("coords","Coord",{isArray:true,isModel:true}), f("nested","Inner",{isModel:true}), f("tag","string")]);
addM("DeepNest5", [f("labels","Label",{isArray:true,isModel:true}), f("money","Money",{isModel:true}), f("name","string")]);
addM("DeepNest6", [f("items","IdVal",{isArray:true,isModel:true}), f("addr","Addr",{optional:true,isModel:true}), f("coord","Coord",{isModel:true})]);
addM("DeepNest7", [f("a","Addr",{isModel:true}), f("b","Addr",{isModel:true}), f("c","Addr",{isModel:true})]);

addM("TimestampEntry", [f("ts","int64"), f("event","string"), f("payload","bytes",{optional:true})]);
addM("ConfigEntry", [f("key","string"), f("intValue","int32",{optional:true}), f("strValue","string",{optional:true}), f("boolValue","boolean",{optional:true}), f("floatValue","float64",{optional:true})]);

console.log(`Total models: ${modelOrder.length}`);

const testModels = modelOrder.filter(n => !SUB_MODELS.includes(n));
console.log(`Test models: ${testModels.length}`);

// ═══════════════════════════════════════════
// Generate alltypes.tsp
// ═══════════════════════════════════════════

function tspType(type, opts = {}) {
  if (opts.isArray) return tspType(type) + "[]";
  return type;
}

function emitTSP() {
  let out = 'import "@specodec/typespec-emitter-core";\n\nusing Specodec.Core;\n\nnamespace AllTypes {\n\n';

  for (const name of modelOrder) {
    const m = models[name];
    out += `  @specodec\n  model ${name} {\n`;
    for (const field of m.fields) {
      const opt = field.optional ? "?" : "";
      const t = tspType(field.type, field);
      out += `    ${field.name}${opt}: ${t};\n`;
    }
    out += `  }\n\n`;
  }

  out += "}\n";

  const tspPath = path.join(SPECS, "alltypes.tsp");
  fs.writeFileSync(tspPath, out);
  console.log(`Wrote ${tspPath}`);
}

emitTSP();

// ═══════════════════════════════════════════
// Generate typeschema.json
// ═══════════════════════════════════════════

function emitSchema() {
  const schema = {};
  for (const name of modelOrder) {
    const m = models[name];
    schema[name] = {
      fields: m.fields.map(f => {
        const s = { name: f.name, type: f.type };
        if (f.optional) s.optional = true;
        if (f.isArray) s.isArray = true;
        if (f.isModel) s.isModel = true;
        return s;
      }),
      recursive: !!m.recursive
    };
  }
  const schemaPath = path.join(VEC, "typeschema.json");
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`Wrote ${schemaPath}`);
}

emitSchema();

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

for (const [name, { value }] of Object.entries(scalars)) {
  fs.writeFileSync(path.join(VEC, "scalars", name + ".mp"), mpEncode(value, mpOpts));
}

// ═══════════════════════════════════════════
// Test data generation
// ═══════════════════════════════════════════

const TEST_STRINGS = ["hello", "world", "test", "foo", "bar", "a\nb", "日本語", "x".repeat(100), "a\x00b"];
const TEST_BYTES = [
  Buffer.from([0xDE, 0xAD, 0xBE, 0xEF]),
  Buffer.from([0x00, 0x01, 0x02]),
  Buffer.from([0xFF]),
  Buffer.alloc(256, 0x42),
  Buffer.alloc(64, 0x00),
  Buffer.alloc(64, 0xFF),
];

function scalarValue(type, seed) {
  switch (type) {
    case "string":  return TEST_STRINGS[seed % TEST_STRINGS.length];
    case "boolean": return seed % 2 === 0;
    case "int8":    return [-42, 0, 127, -128][seed % 4];
    case "int16":   return [-1000, 0, 32767, -32768][seed % 4];
    case "int32":   return [-100000, 0, 2147483647, -2147483648][seed % 4];
    case "int64":   return [BigInt("-9000000000"), BigInt("0"), BigInt("9223372036854775807"), BigInt("-9223372036854775808")][seed % 4];
    case "uint8":   return [0, 128, 200, 255][seed % 4];
    case "uint16":  return [0, 10000, 50000, 65535][seed % 4];
    case "uint32":  return [0, 1000000000, 3000000000, 4294967295][seed % 4];
    case "uint64":  return [BigInt("0"), BigInt("9000000000"), BigInt("16000000000000000000"), BigInt("18446744073709551615")][seed % 4];
    case "float32": return [3.14, -1.5, 0.0, -0.0][seed % 4];
    case "float64": return [2.718281828, -3.14159265358979, 0.0, -0.0][seed % 4];
    case "bytes":   return TEST_BYTES[seed % TEST_BYTES.length];
    default:        throw new Error(`unknown scalar type: ${type}`);
  }
}

function genInstance(modelName, depth = 0) {
  if (depth > 4) return null;
  const m = models[modelName];
  if (!m) throw new Error(`unknown model: ${modelName}`);
  const obj = {};
  let seed = 0;
  for (const field of m.fields) {
    seed++;
    if (field.optional) {
      if (m.recursive && field.isModel && depth >= 2) continue;
      if (!m.recursive && seed % 5 === 0) continue;
    }
    obj[field.name] = genFieldValue(field, depth, seed);
  }
  return obj;
}

function genFieldValue(field, depth, seed) {
  if (field.isArray) {
    const len = 1 + (seed % 3);
    const arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(genSingleValue(field, depth, seed + i));
    }
    return arr;
  }
  return genSingleValue(field, depth, seed);
}

function genSingleValue(field, depth, seed) {
  if (field.isModel) {
    return genInstance(field.type, depth + 1);
  }
  return scalarValue(field.type, seed);
}

// ═══════════════════════════════════════════
// Hardcoded edge instances (override seed-based generation)
// ═══════════════════════════════════════════

const EDGE_INSTANCES = {
  "EdgeBigNums": {
    i8: -128, i16: -32768, i32: -2147483648, i64: BigInt("-9223372036854775808"),
    u8: 255, u16: 65535, u32: 4294967295, u64: BigInt("18446744073709551615")
  },
  "EdgeNegZero": { v: -0.0 },
  "EdgeNullByte": { s: "a\x00b\x00c", b: Buffer.from([0x00, 0x01, 0x00, 0xFF]) },
  "EdgeBoundary": {
    i32_neg129: -129, i32_128: 128, i32_256: 256, i32_65536: 65536,
    i32_neg32769: -32769, u32_65536: 65536
  },
  "EdgeStrLen": {
    s31: "a".repeat(31), s32: "b".repeat(32), s255: "c".repeat(255), s256: "d".repeat(256)
  },
  "EdgeBytesLen": {
    b31: Buffer.alloc(31, 0xAA), b32: Buffer.alloc(32, 0xBB),
    b255: Buffer.alloc(255, 0xCC), b256: Buffer.alloc(256, 0xDD)
  },
  "EdgeArrEmpty": { items: [] },
  "EdgeArrBoundary": {
    a15: Array.from({length: 15}, (_, i) => i),
    a16: Array.from({length: 16}, (_, i) => i)
  },
  "AllOpt1": {},
  "EdgeOneOpt": {},
  "EdgeNullable": {},
  "NestOptInner1": { tag: "empty" },
  "NestOptInner3": {},
  "OptArr3": {},
  "OptSingleString": {},
  "OptSingleInt32": {},
  "OptSingleBoolean": {},
};

function getInstance(name) {
  if (name in EDGE_INSTANCES) return EDGE_INSTANCES[name];
  const m = models[name];
  if (m.fields.length === 0) return {};
  return genInstance(name);
}

// ═══════════════════════════════════════════
// Specodec JSON encoder
// ═══════════════════════════════════════════

function specodecJson(data, modelName) {
  const m = models[modelName];
  
  function writeByType(val, w, field) {
    if (field.optional && (val === null || val === undefined)) { w.writeNull(); return; }
    if (field.isArray) {
      w.beginArray(val.length);
      for (const item of val) { w.nextElement(); writeByType(item, w, { ...field, isArray: false }); }
      w.endArray();
      return;
    }
    if (field.isModel) { encodeObj(val, w, field.type); return; }
    
    switch (field.type) {
      case "string": w.writeString(val); break;
      case "boolean": w.writeBool(val); break;
      case "int8": case "int16": case "int32": w.writeInt32(val); break;
      case "int64": w.writeInt64(val); break;
      case "uint8": case "uint16": case "uint32": w.writeUint32(val); break;
      case "uint64": w.writeUint64(val); break;
      case "float32": w.writeFloat32(val); break;
      case "float64": w.writeFloat64(val); break;
      case "bytes": w.writeBytes(new Uint8Array(val)); break;
      default: throw new Error("Unknown type: " + field.type);
    }
  }
  
  function encodeObj(o, w, name) {
    const model = models[name];
    const presentFields = model.fields.filter(f => !(f.optional && (o[f.name] === null || o[f.name] === undefined)));
    w.beginObject(presentFields.length);
    for (const field of model.fields) {
      if (field.optional && (o[field.name] === null || o[field.name] === undefined)) continue;
      w.writeField(field.name);
      writeByType(o[field.name], w, field);
    }
    w.endObject();
  }
  
  const w = new JsonWriter();
  encodeObj(data, w, modelName);
  return new TextDecoder().decode(w.toBytes());
}

function specodecPrettyJson(data) {
  const sp = (n) => n > 0 ? " ".repeat(n) : "";
  function v(val, ind) {
    if (typeof val === "bigint") return '"' + val.toString() + '"';
    if (Buffer.isBuffer(val)) return '"' + val.toString("base64") + '"';
    if (val === null || val === undefined) return "null";
    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      const items = val.map(item => sp(ind + 2) + v(item, ind + 2));
      return "[\n" + items.join(",\n") + "\n" + sp(ind) + "]";
    }
    if (typeof val === "object") return encodeObj(val, ind + 2);
    if (Object.is(val, -0.0)) return "-0";
    return JSON.stringify(val);
  }
  function encodeObj(o, ind) {
    const parts = [];
    for (const [k, val] of Object.entries(o)) {
      parts.push(sp(ind) + '"' + k + '": ' + v(val, ind));
    }
    if (parts.length === 0) return "{}";
    return "{\n" + parts.join(",\n") + "\n" + sp(ind > 2 ? ind - 2 : 0) + "}";
  }
  return encodeObj(data, 0);
}

function randomFormatJson(data) {
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const spaceOpts = ["", " ", "  ", "   ", "    "];
  const newlineOpts = ["", "\n", "\n\n"];
  const indentOpts = ["", "  ", "    ", "\t"];
  
  function v(val, depth) {
    if (typeof val === "bigint") return '"' + val.toString() + '"';
    if (Buffer.isBuffer(val)) return '"' + val.toString("base64") + '"';
    if (val === null || val === undefined) return "null";
    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      const sep = rand(newlineOpts);
      if (sep === "") {
        return "[" + val.map(item => v(item, depth)).join(rand(spaceOpts) + "," + rand(spaceOpts)) + "]";
      }
      const ind = rand(indentOpts).repeat(depth + 1);
      const items = val.map(item => ind + v(item, depth + 1));
      return "[" + sep + items.join("," + sep) + sep + rand(indentOpts).repeat(depth) + "]";
    }
    if (typeof val === "object") return encodeObj(val, depth + 1);
    if (Object.is(val, -0.0)) return "-0";
    return JSON.stringify(val);
  }
  
  function encodeObj(o, depth) {
    const keys = Object.keys(o);
    if (keys.length === 0) return "{}";
    const sep = rand(newlineOpts);
    if (sep === "") {
      const parts = keys.map(k => '"' + k + '"' + rand(spaceOpts) + ":" + rand(spaceOpts) + v(o[k], depth));
      return "{" + parts.join(rand(spaceOpts) + "," + rand(spaceOpts)) + "}";
    }
    const ind = rand(indentOpts).repeat(depth);
    const parts = keys.map(k => ind + '"' + k + '"' + rand(spaceOpts) + ":" + rand(spaceOpts) + v(o[k], depth));
    return "{" + sep + parts.join("," + sep) + sep + rand(indentOpts).repeat(depth > 0 ? depth - 1 : 0) + "}";
  }
  
  return encodeObj(data, 0);
}

// ═══════════════════════════════════════════
// Specodec Gron encoder
// ═══════════════════════════════════════════

function specodecGron(data, modelName) {
  const m = models[modelName];
  
  function writeByType(val, w, field) {
    if (field.optional && (val === null || val === undefined)) { w.writeNull(); return; }
    if (field.isArray) {
      w.beginArray(val.length);
      for (const item of val) { w.nextElement(); writeByType(item, w, { ...field, isArray: false }); }
      w.endArray();
      return;
    }
    if (field.isModel) { encodeObj(val, w, field.type); return; }
    
    switch (field.type) {
      case "string": w.writeString(val); break;
      case "boolean": w.writeBool(val); break;
      case "int8": case "int16": case "int32": w.writeInt32(val); break;
      case "int64": w.writeInt64(val); break;
      case "uint8": case "uint16": case "uint32": w.writeUint32(val); break;
      case "uint64": w.writeUint64(val); break;
      case "float32": w.writeFloat32(val); break;
      case "float64": w.writeFloat64(val); break;
      case "bytes": w.writeBytes(new Uint8Array(val)); break;
      default: throw new Error("Unknown type: " + field.type);
    }
  }
  
  function encodeObj(o, w, name) {
    const model = models[name];
    const presentFields = model.fields.filter(f => !(f.optional && (o[f.name] === null || o[f.name] === undefined)));
    w.beginObject(presentFields.length);
    for (const field of model.fields) {
      if (field.optional && (o[field.name] === null || o[field.name] === undefined)) continue;
      w.writeField(field.name);
      writeByType(o[field.name], w, field);
    }
    w.endObject();
  }
  
  const w = new GronWriter();
  encodeObj(data, w, modelName);
  return new TextDecoder().decode(w.toBytes());
}

// ═══════════════════════════════════════════
// Generate object test vectors
// ═══════════════════════════════════════════

const objects = {};
for (const name of testModels) {
  objects[name] = getInstance(name);
}

for (const [name, data] of Object.entries(objects)) {
  fs.writeFileSync(path.join(VEC, name + ".json"), specodecJson(data, name));
  fs.writeFileSync(path.join(VEC, name + ".unformatted.json"), randomFormatJson(data));
  fs.writeFileSync(path.join(VEC, name + ".gron"), specodecGron(data, name));
  fs.writeFileSync(path.join(VEC, name + ".msgpack"), mpEncode(data, mpOpts));
}

// ═══════════════════════════════════════════
// Generate manifest.json
// ═══════════════════════════════════════════

const manifest = { scalars: {}, objects: {}, testModels };

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
console.log(`Done.`);

// ═══════════════════════════════════════════
// Generate emit runner files
// ═══════════════════════════════════════════

function toSnakeRust(name) {
  return name.replace(/([A-Z])/g, (m, c, i) => (i ? '_' : '') + c.toLowerCase());
}
function toScreamingRust(name) {
  return toSnakeRust(name).toUpperCase();
}

function generateTsRunner(testModels, models) {
  const names = testModels.map(n => `"${n}"`).join(", ");
  return `// Generated by gen_types.cjs. DO NOT EDIT.
import { MsgPackReader, JsonReader } from "@specodec/specodec-ts";
import * as gen from "../gen/test-service.types.ts";
import * as fs from "fs";
import * as path from "path";
import { dumpModel } from "./dump_emit.ts";

const VEC = process.env.VEC_DIR!;
const OUT = process.env.OUT_DIR!;
fs.mkdirSync(OUT, { recursive: true });

const TEST_MODELS: string[] = [${names}];

let fail = 0;
for (const name of TEST_MODELS) {
  const codec = (gen as any)[\`\${name}Codec\`];
  try {
    const b = new Uint8Array(fs.readFileSync(path.join(VEC, \`\${name}.msgpack\`)));
    const obj = codec.decode(new MsgPackReader(b));
    fs.writeFileSync(path.join(OUT, \`\${name}.msgpack\`), Buffer.from(codec.encodeMsgPack(obj)));
    fs.writeFileSync(path.join(OUT, \`\${name}.decoded.json\`), dumpModel(name, obj));
  } catch(e: any) { console.error(\`FAIL \${name} mp: \${e.message}\`); fail++; }
  try {
    const b = new Uint8Array(fs.readFileSync(path.join(VEC, \`\${name}.json\`)));
    const obj = codec.decode(new JsonReader(b));
    fs.writeFileSync(path.join(OUT, \`\${name}.json\`), Buffer.from(codec.encodeJson(obj)));
    fs.writeFileSync(path.join(OUT, \`\${name}.decoded.json\`), dumpModel(name, obj));
  } catch(e: any) { console.error(\`FAIL \${name} json: \${e.message}\`); fail++; }
}
console.log(\`emit-ts: \${TEST_MODELS.length * 2 - fail} passed, \${fail} failed\`);
if (fail > 0) process.exit(1);
`;
}

function generatePyRunner(testModels, models) {
  const names = testModels.map(n => `    '${n}'`).join(",\n");
  return `# Generated by gen_types.cjs. DO NOT EDIT.
import sys, os
sys.path.insert(0, '/specodec-python/src')
from specodec import MsgPackReader, JsonReader
from gen.test_service_types import *
from dump_emit import dump_model

VEC = os.environ['VEC_DIR']
OUT = os.environ['OUT_DIR']
os.makedirs(OUT, exist_ok=True)

TEST_MODELS = [
${names},
]

fail = 0
for name in TEST_MODELS:
    codec = globals()[f'{name}Codec']
    try:
        b = open(f'{VEC}/{name}.msgpack', 'rb').read()
        obj = codec.decode(MsgPackReader(b))
        open(f'{OUT}/{name}.msgpack', 'wb').write(codec.encode_msgpack(obj))
        open(f'{OUT}/{name}.decoded.json', 'w').write(dump_model(name, obj))
    except Exception as e:
        print(f'FAIL {name} mp: {e}'); fail += 1
    try:
        b = open(f'{VEC}/{name}.json', 'rb').read()
        obj = codec.decode(JsonReader(b))
        open(f'{OUT}/{name}.json', 'wb').write(codec.encode_json(obj))
        open(f'{OUT}/{name}.decoded.json', 'w').write(dump_model(name, obj))
    except Exception as e:
        print(f'FAIL {name} json: {e}'); fail += 1

print(f'emit-py: {len(TEST_MODELS)*2 - fail} passed, {fail} failed')
if fail: sys.exit(1)
`;
}

function generateRustRunner(testModels, models) {
  const mpEntries = testModels.map(n => {
    const s = toScreamingRust(n) + '_CODEC';
    return `    m.insert("${n}", Box::new(|b| {
        let mut r = MsgPackReader::new(b);
        let o = (${s}.decode)(&mut r).unwrap();
        (${s}.encode_msgpack)(&o)
    }));`;
  }).join("\n");
  const jsonEntries = testModels.map(n => {
    const s = toScreamingRust(n) + '_CODEC';
    return `    m.insert("${n}", Box::new(|b| {
        let mut r = JsonReader::new(b).unwrap();
        let o = (${s}.decode)(&mut r).unwrap();
        (${s}.encode_json)(&o)
    }));`;
  }).join("\n");
  const names = testModels.map(n => `"${n}"`).join(", ");
  const dumpEntries = testModels.map(n => {
    const s = toScreamingRust(n) + '_CODEC';
    const fn = 'dump_' + toSnakeRust(n);
    return `    m.insert("${n}", Box::new(|b, v| {
        let o = if v {
            let mut r = MsgPackReader::new(b);
            (${s}.decode)(&mut r).unwrap()
        } else {
            let mut r = JsonReader::new(b).unwrap();
            (${s}.decode)(&mut r).unwrap()
        };
        ${fn}(&o)
    }));`;
  }).join("\n");
  return `// Generated by gen_types.cjs. DO NOT EDIT.
use std::collections::HashMap;
use std::path::PathBuf;
use std::fs;
use specodec::{MsgPackReader, JsonReader};

type RtFn = Box<dyn Fn(&[u8]) -> Vec<u8>>;
type DumpFn = Box<dyn Fn(&[u8], bool) -> String>;

fn build_mp() -> HashMap<&'static str, RtFn> {
    let mut m: HashMap<&'static str, RtFn> = HashMap::new();
${mpEntries}
    m
}

fn build_json() -> HashMap<&'static str, RtFn> {
    let mut m: HashMap<&'static str, RtFn> = HashMap::new();
${jsonEntries}
    m
}

fn build_dump() -> HashMap<&'static str, DumpFn> {
    let mut m: HashMap<&'static str, DumpFn> = HashMap::new();
${dumpEntries}
    m
}

static TEST_MODELS: &[&str] = &[${names}];

pub fn run_emit(vec_dir: &PathBuf, out_dir: &PathBuf) {
    let mp = build_mp();
    let json = build_json();
    let dump = build_dump();
    let mut fail = 0usize;

    for &name in TEST_MODELS {
        match fs::read(vec_dir.join(format!("{name}.msgpack"))) {
            Ok(b) => {
                let out = mp[name](&b);
                fs::write(out_dir.join(format!("{name}.msgpack")), &out).unwrap();
                let decoded = dump[name](&b, true);
                fs::write(out_dir.join(format!("{name}.decoded.json")), decoded).unwrap();
            }
            Err(e) => { eprintln!("FAIL {name} mp: {e}"); fail += 1; }
        }
        match fs::read(vec_dir.join(format!("{name}.json"))) {
            Ok(b) => {
                let out = json[name](&b);
                fs::write(out_dir.join(format!("{name}.json")), &out).unwrap();
                let decoded = dump[name](&b, false);
                fs::write(out_dir.join(format!("{name}.decoded.json")), decoded).unwrap();
            }
            Err(e) => { eprintln!("FAIL {name} json: {e}"); fail += 1; }
        }
    }

    let total = TEST_MODELS.len() * 2;
    println!("emit-rust: {} passed, {} failed", total - fail, fail);
    if fail > 0 { std::process::exit(1); }
}
`;
}

function generateGoRunner(testModels, models) {
  const mpEntries = testModels.map(n =>
    `        "${n}": func(b []byte) []byte {
            r := specodec.NewMsgPackReader(b)
            return ${n}Codec.EncodeMsgPack(${n}Codec.Decode(r))
        },`
  ).join("\n");
  const jsonEntries = testModels.map(n =>
    `        "${n}": func(b []byte) []byte {
            r := specodec.NewJsonReader(b)
            return ${n}Codec.EncodeJson(${n}Codec.Decode(r))
        },`
  ).join("\n");
  const dumpEntries = testModels.map(n =>
    `        "${n}": func(b []byte, isMp bool) string {
            var obj = ${n}Codec.Decode(func() specodec.SpecReader {
                if isMp { return specodec.NewMsgPackReader(b) }
                return specodec.NewJsonReader(b)
            }())
            return dump${n}(*obj)
        },`
  ).join("\n");
  const names = testModels.map(n => `"${n}"`).join(", ");
  return `// Generated by gen_types.cjs. DO NOT EDIT.
package main

import (
    "fmt"
    "os"
    "path/filepath"
    specodec "github.com/specodec/specodec-go"
    . "test/emit_gen"
)

type rtFn func([]byte) []byte
type dumpFn func([]byte, bool) string

var testModels = []string{${names}}

func buildMp() map[string]rtFn {
    return map[string]rtFn{
${mpEntries}
    }
}

func buildJson() map[string]rtFn {
    return map[string]rtFn{
${jsonEntries}
    }
}

func buildDump() map[string]dumpFn {
    return map[string]dumpFn{
${dumpEntries}
    }
}

func runEmit(vecDir, outDir string) {
    mp := buildMp()
    js := buildJson()
    dump := buildDump()
    fail := 0

    for _, name := range testModels {
        n := name
        func() {
            defer func() {
                if r := recover(); r != nil {
                    fmt.Printf("FAIL %s mp: %v\\n", n, r); fail++
                }
            }()
            b, _ := os.ReadFile(filepath.Join(vecDir, n+".msgpack"))
            os.WriteFile(filepath.Join(outDir, n+".msgpack"), mp[n](b), 0644)
            os.WriteFile(filepath.Join(outDir, n+".decoded.json"), []byte(dump[n](b, true)), 0644)
        }()
        func() {
            defer func() {
                if r := recover(); r != nil {
                    fmt.Printf("FAIL %s json: %v\\n", n, r); fail++
                }
            }()
            b, _ := os.ReadFile(filepath.Join(vecDir, n+".json"))
            os.WriteFile(filepath.Join(outDir, n+".json"), js[n](b), 0644)
            os.WriteFile(filepath.Join(outDir, n+".decoded.json"), []byte(dump[n](b, false)), 0644)
        }()
    }

    total := len(testModels) * 2
    fmt.Printf("emit-go: %d passed, %d failed\\n", total-fail, fail)
    if fail > 0 { os.Exit(1) }
}
`;
}

function generateKotlinRunner(testModels, models) {
  const mpEntries = testModels.map(n =>
    `    "${n}" to { b: ByteArray ->
        ${n}Codec.encodeMsgPack(${n}Codec.decode(MsgPackReader(b))) },`
  ).join("\n");
  const jsonEntries = testModels.map(n =>
    `    "${n}" to { b: ByteArray ->
        ${n}Codec.encodeJson(${n}Codec.decode(JsonReader(b))) },`
  ).join("\n");
  const dumpEntries = testModels.map(n =>
    `    "${n}" to { b: ByteArray, isMp: Boolean ->
        val r = if (isMp) MsgPackReader(b) else JsonReader(b)
        dump${n}(${n}Codec.decode(r)) },`
  ).join("\n");
  const names = testModels.map(n => `"${n}"`).join(", ");
  return `// Generated by gen_types.cjs. DO NOT EDIT.
package alltypes
import specodec.*
import java.io.File

val testModels = listOf(${names})

val mpRoundtrip: Map<String, (ByteArray) -> ByteArray> = mapOf(
${mpEntries}
)

val jsonRoundtrip: Map<String, (ByteArray) -> ByteArray> = mapOf(
${jsonEntries}
)

val dumpRoundtrip: Map<String, (ByteArray, Boolean) -> String> = mapOf(
${dumpEntries}
)

fun runEmit(vecDir: String, outDir: String) {
    File(outDir).mkdirs()
    var fail = 0

    for (name in testModels) {
        try {
            val b = File(vecDir, "\$name.msgpack").readBytes()
            File(outDir, "\$name.msgpack").writeBytes(mpRoundtrip[name]!!(b))
            File(outDir, "\$name.decoded.json").writeText(dumpRoundtrip[name]!!(b, true))
        } catch (e: Exception) { println("FAIL \$name mp: \$e"); fail++ }
        try {
            val b = File(vecDir, "\$name.json").readBytes()
            File(outDir, "\$name.json").writeBytes(jsonRoundtrip[name]!!(b))
            File(outDir, "\$name.decoded.json").writeText(dumpRoundtrip[name]!!(b, false))
        } catch (e: Exception) { println("FAIL \$name json: \$e"); fail++ }
    }

    val total = testModels.size * 2
    println("emit-kotlin: \${total - fail} passed, \$fail failed")
    if (fail > 0) System.exit(1)
}
`;
}

function generateDartRunner(testModels, models) {
  const mpEntries = testModels.map(n =>
    `  '${n}': (b) => ${n}Codec.encodeMsgPack(${n}Codec.decode(MsgPackReader(b))),`
  ).join("\n");
  const jsonEntries = testModels.map(n =>
    `  '${n}': (b) => ${n}Codec.encodeJson(${n}Codec.decode(JsonReader(b))),`
  ).join("\n");
  const dumpEntries = testModels.map(n =>
    `  '${n}': (b, isMp) => dump${n}(${n}Codec.decode(isMp ? MsgPackReader(b) : JsonReader(b))),`
  ).join("\n");
  const names = testModels.map(n => `'${n}'`).join(", ");
  return `// Generated by gen_types.cjs. DO NOT EDIT.
import 'dart:io';
import 'dart:typed_data';
import 'package:specodec/specodec.dart';
import '../lib/test_service_types.dart';
import 'dump_emit.dart';

final _vec = Platform.environment['VEC_DIR']!;
final _out = Platform.environment['OUT_DIR']!;

const testModels = [${names}];

final mpRoundtrip = <String, Uint8List Function(Uint8List)>{
${mpEntries}
};

final jsonRoundtrip = <String, Uint8List Function(Uint8List)>{
${jsonEntries}
};

final dumpRoundtrip = <String, String Function(Uint8List, bool)>{
${dumpEntries}
};

void main() {
  Directory(_out).createSync(recursive: true);
  var fail = 0;

  for (final name in testModels) {
    try {
      final b = File('\$_vec/\$name.msgpack').readAsBytesSync();
      File('\$_out/\$name.msgpack').writeAsBytesSync(mpRoundtrip[name]!(b));
      File('\$_out/\$name.decoded.json').writeAsStringSync(dumpRoundtrip[name]!(b, true));
    } catch (e) { print('FAIL \$name mp: \$e'); fail++; }
    try {
      final b = File('\$_vec/\$name.json').readAsBytesSync();
      File('\$_out/\$name.json').writeAsBytesSync(jsonRoundtrip[name]!(b));
      File('\$_out/\$name.decoded.json').writeAsStringSync(dumpRoundtrip[name]!(b, false));
    } catch (e) { print('FAIL \$name json: \$e'); fail++; }
  }

  print('emit-dart: \${testModels.length * 2 - fail} passed, \$fail failed');
  if (fail > 0) exit(1);
}
`;
}

function generateSwiftRunner(testModels, models) {
  const mpEntries = testModels.map(n =>
    `    "${n}": { b in ${n}Codec.encodeMsgPack(try ${n}Codec.decode(MsgPackReader(b))) },`
  ).join("\n");
  const jsonEntries = testModels.map(n =>
    `    "${n}": { b in ${n}Codec.encodeJson(try ${n}Codec.decode(JsonReader(b))) },`
  ).join("\n");
  const dumpEntries = testModels.map(n =>
    `    "${n}": { b, isMp in dump${n}(try ${n}Codec.decode(isMp ? MsgPackReader(b) : JsonReader(b))) },`
  ).join("\n");
  const names = testModels.map(n => `"${n}"`).join(", ");
  return `// Generated by gen_types.cjs. DO NOT EDIT.
import Foundation
import Specodec

private typealias RTFn = (Data) throws -> Data
private typealias DumpFn = (Data, Bool) throws -> String

nonisolated(unsafe) private let testModels: [String] = [${names}]

nonisolated(unsafe) private let mpRoundtrip: [String: RTFn] = [
${mpEntries}
]

nonisolated(unsafe) private let jsonRoundtrip: [String: RTFn] = [
${jsonEntries}
]

nonisolated(unsafe) private let dumpRoundtrip: [String: DumpFn] = [
${dumpEntries}
]

func runEmit() throws {
    let vecDir = ProcessInfo.processInfo.environment["VEC_DIR"]!
    let outDir = ProcessInfo.processInfo.environment["OUT_DIR"]!
    try FileManager.default.createDirectory(
        atPath: outDir, withIntermediateDirectories: true)
    var fail = 0

    for name in testModels {
        do {
            let b = try Data(contentsOf: URL(fileURLWithPath: "\\(vecDir)/\\(name).msgpack"))
            try mpRoundtrip[name]!(b).write(to: URL(fileURLWithPath: "\\(outDir)/\\(name).msgpack"))
            try dumpRoundtrip[name]!(b, true).write(to: URL(fileURLWithPath: "\\(outDir)/\\(name).decoded.json"), atomically: true, encoding: .utf8)
        } catch { print("FAIL \\(name) mp: \\(error)"); fail += 1 }
        do {
            let b = try Data(contentsOf: URL(fileURLWithPath: "\\(vecDir)/\\(name).json"))
            try jsonRoundtrip[name]!(b).write(to: URL(fileURLWithPath: "\\(outDir)/\\(name).json"))
            try dumpRoundtrip[name]!(b, false).write(to: URL(fileURLWithPath: "\\(outDir)/\\(name).decoded.json"), atomically: true, encoding: .utf8)
        } catch { print("FAIL \\(name) json: \\(error)"); fail += 1 }
    }

    let total = testModels.count * 2
    print("emit-swift: \\(total - fail) passed, \\(fail) failed")
    if fail > 0 { exit(1) }
}
`;
}

function generateTsDump(models) {
  const schema = Object.entries(models).map(([name, m]) => {
    const fields = m.fields.map(f => {
      const parts = [`n:"${f.name}"`, `t:"${f.type}"`];
      if (f.optional) parts.push('o:true');
      if (f.isArray) parts.push('a:true');
      if (f.isModel) parts.push('m:true');
      return `{${parts.join(',')}}`;
    }).join(',');
    return `"${name}":[${fields}]`;
  }).join(',');
  return `// Generated by gen_types.cjs. DO NOT EDIT.
const _sch: Record<string,{n:string,t:string,o?:boolean,a?:boolean,m?:boolean}[]> = {${schema}};

function _dn(v: number): string { return Object.is(v, -0) ? "-0" : String(v); }

function _dv(v: any, f: {t:string,o?:boolean,a?:boolean,m?:boolean}): string {
  if (v === undefined || v === null) return "null";
  if (f.a) return "[" + (v as any[]).map((e:any) => _dv(e, {...f, a: false as any})).join(",") + "]";
  if (f.m) return dumpModel(f.t, v);
  switch (f.t) {
    case "string": return JSON.stringify(v);
    case "boolean": return v ? "true" : "false";
    case "float32": case "float64": return _dn(v);
    case "int64": return '"' + v.toString() + '"';
    case "uint64": return '"' + v.toString() + '"';
    case "bytes": return '"' + Buffer.from(v).toString("base64") + '"';
    default: return String(v);
  }
}

export function dumpModel(name: string, obj: any): string {
  const fields = _sch[name];
  if (!fields) throw new Error("unknown model: " + name);
  const p: string[] = [];
  for (const f of fields) {
    const v = obj[f.n];
    if (f.o && v === undefined) continue;
    p.push('"' + f.n + '":' + _dv(v, f));
  }
  return "{" + p.join(",") + "}";
}
`;
}

function generatePyDump(models) {
  const schema = Object.entries(models).map(([name, m]) => {
    const fields = m.fields.map(f => {
      const parts = [`'n':'${f.name}'`, `'t':'${f.type}'`];
      if (f.optional) parts.push("'o':True");
      if (f.isArray) parts.push("'a':True");
      if (f.isModel) parts.push("'m':True");
      return `{${parts.join(',')}}`;
    }).join(',');
    return `'${name}':[${fields}]`;
  }).join(',');
  return `# Generated by gen_types.cjs. DO NOT EDIT.
import base64, json, math

_sch = {${schema}}

def _dn(v):
    if isinstance(v, float) and math.copysign(1, v) < 0 and v == 0:
        return '-0'
    if isinstance(v, float) and v == int(v) and not math.isinf(v):
        return str(int(v))
    return repr(v)

def _dv(v, f):
    if v is None:
        return 'null'
    if f.get('a'):
        return '[' + ','.join(_dv(e, {**f, 'a': False}) for e in v) + ']'
    if f.get('m'):
        return dump_model(f['t'], v)
    t = f['t']
    if t == 'string': return json.dumps(v)
    if t == 'boolean': return 'true' if v else 'false'
    if t in ('float32', 'float64'): return _dn(v)
    if t == 'int64': return '"' + str(v) + '"'
    if t == 'uint64': return '"' + str(v) + '"'
    if t == 'bytes': return '"' + base64.b64encode(v).decode() + '"'
    return str(v)

def dump_model(name, obj):
    fields = _sch.get(name)
    if fields is None:
        raise ValueError('unknown model: ' + name)
    parts = []
    for f in fields:
        v = getattr(obj, f['n'], None)
        if f.get('o') and v is None:
            continue
        parts.append('"' + f['n'] + '":' + _dv(v, f))
    return '{' + ','.join(parts) + '}'
`;
}

function toGoField(name) {
  // Go emitter only capitalizes first letter, keeps rest unchanged
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateRustDump(models) {
  const dumps = [];
  for (const [name, m] of Object.entries(models)) {
    const fn = 'dump_' + toSnakeRust(name);
    const lines = [];
    for (const f of m.fields) {
      const rustField = f.name;
      let valExpr;
      if (f.isArray) {
        let mapExpr;
        if (f.isModel) {
          mapExpr = 'dump_' + toSnakeRust(f.type) + '(e)';
        } else if (f.type === 'string') {
          mapExpr = '_ds(e)';
        } else if (f.type === 'boolean') {
          mapExpr = 'if *e { "true" } else { "false" }';
        } else if (f.type === 'bytes') {
          mapExpr = 'format!("\\"{}\\"", _db(e))';
        } else if (f.type === 'int64') {
          mapExpr = '_di(*e)';
        } else if (f.type === 'uint64') {
          mapExpr = '_du(*e)';
        } else if (f.type === 'float32' || f.type === 'float64') {
          mapExpr = '_dn(*e as f64)';
        } else {
          mapExpr = 'e.to_string()';
        }
        valExpr = 'format!("[{}]", o.' + rustField + '.iter().map(|e| ' + mapExpr + ').collect::<Vec<_>>().join(","))';
      } else if (f.isModel) {
        valExpr = 'dump_' + toSnakeRust(f.type) + '(&o.' + rustField + ')';
      } else if (f.type === 'string') {
        valExpr = '_ds(&o.' + rustField + ')';
      } else if (f.type === 'boolean') {
        valExpr = 'if o.' + rustField + ' { "true" } else { "false" }';
      } else if (f.type === 'bytes') {
        valExpr = 'format!("\\"{}\\"", _db(&o.' + rustField + '))';
      } else if (f.type === 'int64') {
        valExpr = '_di(o.' + rustField + ')';
} else if (f.type === 'uint64') {
        valExpr = `_du(o.${f.name})`;
      } else if (f.type === 'float32' || f.type === 'float64') {
        valExpr = f.type === 'float32' ? `_dnf(o.${f.name})` : `_dn(o.${f.name})`;
      } else {
        valExpr = `o.${f.name}.toString()`;
      }
      
      if (f.optional) {
        let optExpr;
        if (f.isArray) {
          let mapExpr;
          if (f.isModel) {
            mapExpr = 'dump_' + toSnakeRust(f.type) + '(e)';
          } else if (f.type === 'string') {
            mapExpr = '_ds(e)';
          } else if (f.type === 'boolean') {
            mapExpr = 'if *e { "true" } else { "false" }';
          } else if (f.type === 'bytes') {
            mapExpr = 'format!("\\"{}\\"", _db(e))';
          } else if (f.type === 'int64') {
            mapExpr = '_di(*e)';
          } else if (f.type === 'uint64') {
            mapExpr = '_du(*e)';
          } else if (f.type === 'float32' || f.type === 'float64') {
            mapExpr = '_dn(*e as f64)';
          } else {
            mapExpr = 'e.to_string()';
          }
          optExpr = 'format!("[{}]", v.iter().map(|e| ' + mapExpr + ').collect::<Vec<_>>().join(","))';
        } else if (f.isModel) {
          optExpr = 'dump_' + toSnakeRust(f.type) + '(v)';
        } else if (f.type === 'string') {
          optExpr = '_ds(v)';
        } else if (f.type === 'boolean') {
          optExpr = 'if *v { "true" } else { "false" }';
        } else if (f.type === 'bytes') {
          optExpr = 'format!("\\"{}\\"", _db(v))';
        } else if (f.type === 'int64') {
          optExpr = '_di(*v)';
        } else if (f.type === 'uint64') {
          optExpr = '_du(*v)';
        } else if (f.type === 'float32' || f.type === 'float64') {
          optExpr = '_dn(*v as f64)';
        } else {
          optExpr = '(*v).to_string()';
        }
        lines.push('    if let Some(v) = &o.' + rustField + ' { parts.push(format!("\\"' + f.name + '\\":{}", ' + optExpr + ')); }');
      } else {
        lines.push('    parts.push(format!("\\"' + f.name + '\\":{}", ' + valExpr + '));');
      }
    }
    dumps.push('fn ' + fn + '(o: &' + name + ') -> String {\n    let mut parts: Vec<String> = Vec::new();\n' + lines.join('\n') + '\n    format!("{{{}}}", parts.join(","))\n}');
  }
  
  const header = '// Generated by gen_types.cjs. DO NOT EDIT.\n' +
    'use std::fmt::Write;\n\n' +
    'fn _ds(v: &str) -> String {\n' +
    '    let mut r = String::new();\n' +
    '    r.push(\'"\');\n' +
    '    for c in v.chars() {\n' +
    '        match c {\n' +
    '            \'\\x22\' => { r.push(\'\\x5c\'); r.push(\'\\x22\'); }\n' +
    '            \'\\x5c\' => { r.push(\'\\x5c\'); r.push(\'\\x5c\'); }\n' +
    '            \'\\x0a\' => { r.push(\'\\x5c\'); r.push(\'n\'); }\n' +
    '            \'\\x09\' => { r.push(\'\\x5c\'); r.push(\'t\'); }\n' +
    '            \'\\x0d\' => { r.push(\'\\x5c\'); r.push(\'r\'); }\n' +
    '            c if (c as u32) < 0x20 => { write!(r, "\\\\u{:04x}", c as u32).unwrap(); }\n' +
    '            c => r.push(c),\n' +
    '        }\n' +
    '    }\n' +
    '    r.push(\'"\');\n' +
    '    r\n' +
    '}\n\n' +
    'fn _dn(v: f64) -> String {\n' +
    '    if v == 0.0 && v.is_sign_negative() { return "-0".to_string(); }\n' +
    '    let s = format!("{}", v);\n' +
    '    if s.ends_with(".0") { s[..s.len()-2].to_string() } else { s }\n' +
    '}\n\n' +
    'fn _di(v: i64) -> String { format!("\\"{}\\"", v) }\n' +
    'fn _du(v: u64) -> String { format!("\\"{}\\"", v) }\n' +
    'fn _db(v: &[u8]) -> String {\n' +
    '    use base64::{Engine as _, engine::general_purpose::STANDARD};\n' +
    '    STANDARD.encode(v)\n' +
    '}\n\n';
  
  return header + dumps.join('\n');
}

function generateGoDump(models) {
  const dumps = Object.entries(models).map(([name, m]) => {
    const fn = name;
    const lines = m.fields.map(f => {
      const goField = toGoField(f.name);
let valExpr;
      if (f.isArray) {
        if (f.isModel) {
          valExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, dump${f.type}(e)) }; return arr }(), ",")+"]"`;
        } else if (f.type === 'string') {
          valExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _ds(e)) }; return arr }(), ",")+"]"`;
        } else if (f.type === 'boolean') {
          valExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _dbool(e)) }; return arr }(), ",")+"]"`;
        } else if (f.type === 'bytes') {
          valExpr = '"[" + strings.Join(func() []string { var arr []string; for _, e := range o.' + goField + ' { arr = append(arr, string(byte(34)) + _db(e) + string(byte(34))) }; return arr }(), ",") + "]"';
        } else if (f.type === 'int64') {
          valExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _di(e)) }; return arr }(), ",")+"]"`;
        } else if (f.type === 'uint64') {
          valExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _du(e)) }; return arr }(), ",")+"]"`;
        } else if (f.type === 'float32' || f.type === 'float64') {
          valExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _dn(float64(e))) }; return arr }(), ",")+"]"`;
        } else {
          valExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, strconv.Itoa(int(e))) }; return arr }(), ",")+"]"`;
        }
      } else if (f.isModel) {
        valExpr = `dump${f.type}(o.${goField})`;
      } else if (f.type === 'string') {
        valExpr = `_ds(o.${goField})`;
      } else if (f.type === 'boolean') {
        valExpr = `_dbool(o.${goField})`;
      } else if (f.type === 'bytes') {
        valExpr = 'string(byte(34)) + _db(o.' + goField + ') + string(byte(34))';
      } else if (f.type === 'int64') {
        valExpr = `_di(o.${goField})`;
      } else if (f.type === 'uint64') {
        valExpr = `_du(o.${goField})`;
      } else if (f.type === 'float32' || f.type === 'float64') {
        valExpr = `_dn(float64(o.${goField}))`;
      } else {
        valExpr = `strconv.Itoa(int(o.${goField}))`;
      }
      
      if (f.optional) {
        let optExpr;
        if (f.isArray) {
          // Arrays (including bytes) are already slices, no dereference needed
          if (f.isModel) {
            optExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, dump${f.type}(e)) }; return arr }(), ",")+"]"`;
          } else if (f.type === 'string') {
            optExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _ds(e)) }; return arr }(), ",")+"]"`;
          } else if (f.type === 'boolean') {
            optExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _dbool(e)) }; return arr }(), ",")+"]"`;
          } else if (f.type === 'bytes') {
            optExpr = '"[" + strings.Join(func() []string { var arr []string; for _, e := range o.' + goField + ' { arr = append(arr, string(byte(34)) + _db(e) + string(byte(34))) }; return arr }(), ",") + "]"';
          } else if (f.type === 'int64') {
            optExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _di(e)) }; return arr }(), ",")+"]"`;
          } else if (f.type === 'uint64') {
            optExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _du(e)) }; return arr }(), ",")+"]"`;
          } else if (f.type === 'float32' || f.type === 'float64') {
            optExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, _dn(float64(e))) }; return arr }(), ",")+"]"`;
          } else {
            optExpr = `"["+strings.Join(func() []string { var arr []string; for _, e := range o.${goField} { arr = append(arr, strconv.Itoa(int(e))) }; return arr }(), ",")+"]"`;
          }
        } else if (f.type === 'bytes') {
          // bytes is slice, no dereference even for optional
          optExpr = 'string(byte(34)) + _db(o.' + goField + ') + string(byte(34))';
        } else if (f.isModel) {
          optExpr = `dump${f.type}(*o.${goField})`;
        } else if (f.type === 'string') {
          optExpr = `_ds(*o.${goField})`;
        } else if (f.type === 'boolean') {
          optExpr = `_dbool(*o.${goField})`;
        } else if (f.type === 'int64') {
          optExpr = `_di(*o.${goField})`;
        } else if (f.type === 'uint64') {
          optExpr = `_du(*o.${goField})`;
        } else if (f.type === 'float32' || f.type === 'float64') {
          optExpr = `_dn(float64(*o.${goField}))`;
        } else {
          optExpr = `strconv.Itoa(int(*o.${goField}))`;
        }
        return `	if o.${goField} != nil { parts = append(parts, "\\"${f.name}\\":"+${optExpr}) }`;
      }
      return `	parts = append(parts, "\\"${f.name}\\":"+${valExpr})`;
    }).join('\n');
    return `func dump${fn}(o ${fn}) string {
	parts := []string{}
${lines}
	return "{"+strings.Join(parts, ",")+"}"
}`;
  }).join('\n');
  
  return `// Generated by gen_types.cjs. DO NOT EDIT.
package main

import (
    "encoding/base64"
    "fmt"
    "math"
    "strconv"
    "strings"
    . "test/emit_gen"
)

func _ds(v string) string {
    var b strings.Builder
    b.WriteByte(34)
    for i := 0; i < len(v); i++ {
        c := v[i]
        switch c {
        case 34: b.WriteByte(92); b.WriteByte(34)
        case 92: b.WriteByte(92); b.WriteByte(92)
        case 10: b.WriteByte(92); b.WriteByte(110)
        case 9: b.WriteByte(92); b.WriteByte(116)
        case 13: b.WriteByte(92); b.WriteByte(114)
        default:
            if c < 32 {
                b.WriteByte(92); b.WriteByte(117); b.WriteString(fmt.Sprintf("%04x", c))
            } else {
                b.WriteByte(c)
            }
        }
    }
    b.WriteByte(34)
    return b.String()
}

func _dn(v float64) string {
    if v == 0 && math.Signbit(v) { return "-0" }
    s := strconv.FormatFloat(v, 'f', -1, 64)
    if strings.HasSuffix(s, ".0") { return s[:len(s)-2] }
    return s
}

func _dbool(v bool) string { if v { return "true" } else { return "false" } }
func _di(v int64) string { return string(34) + strconv.FormatInt(v, 10) + string(34) }
func _du(v uint64) string { return string(34) + strconv.FormatUint(v, 10) + string(34) }
func _db(v []byte) string { return base64.StdEncoding.EncodeToString(v) }

${dumps}
`;
}

function generateKotlinDump(models) {
  const dumps = Object.entries(models).map(([name, m]) => {
    const lines = m.fields.map(f => {
      let valExpr;
      let addQuotes = false;
      if (f.isArray) {
        if (f.isModel) {
          valExpr = `o.${f.name}.joinToString(",", "[", "]") { dump${f.type}(it) }`;
        } else if (f.type === 'string') {
          valExpr = `o.${f.name}.joinToString(",", "[", "]") { _ds(it) }`;
        } else if (f.type === 'boolean') {
          valExpr = `o.${f.name}.joinToString(",", "[", "]") { if (it) "true" else "false" }`;
        } else if (f.type === 'bytes') {
          valExpr = `o.${f.name}.joinToString(",", "[", "]") { "\\\"" + _db(it) + "\\\"" }`;
        } else if (f.type === 'int64') {
          valExpr = `o.${f.name}.joinToString(",", "[", "]") { _di(it) }`;
        } else if (f.type === 'uint64') {
          valExpr = `o.${f.name}.joinToString(",", "[", "]") { _du(it) }`;
        } else if (f.type === 'float32' || f.type === 'float64') {
          valExpr = f.type === 'float32' ? `o.${f.name}.joinToString(",", "[", "]") { _dnf(it) }` : `o.${f.name}.joinToString(",", "[", "]") { _dn(it) }`;
        } else {
          valExpr = `o.${f.name}.joinToString(",", "[", "]") { it.toString() }`;
        }
      } else if (f.isModel) {
        valExpr = `dump${f.type}(o.${f.name})`;
      } else if (f.type === 'string') {
        valExpr = `_ds(o.${f.name})`;
      } else if (f.type === 'boolean') {
        valExpr = `(if (o.${f.name}) "true" else "false")`;
      } else if (f.type === 'bytes') {
        addQuotes = true;
        valExpr = `_db(o.${f.name})`;
      } else if (f.type === 'int64') {
        valExpr = `_di(o.${f.name})`;
} else if (f.type === 'uint64') {
        valExpr = `_du(o.${f.name})`;
      } else if (f.type === 'float32' || f.type === 'float64') {
        valExpr = f.type === 'float32' ? `_dnf(o.${f.name})` : `_dn(o.${f.name})`;
      } else {
        valExpr = `o.${f.name}.toString()`;
      }
      
      if (f.optional) {
        const ktType = f.type === 'uint64' ? 'ULong?' : f.type === 'int64' ? 'Long?' : f.type === 'boolean' ? 'Boolean?' : f.type === 'string' ? 'String?' : f.type === 'bytes' ? 'ByteArray?' : f.isModel ? `${f.type}?` : 'Int?';
        const regex = new RegExp(`o\\.${f.name}`, 'g');
        const optValExpr = addQuotes ? `${valExpr.replace(regex, 'it')} + "\\\""` : valExpr.replace(regex, 'it');
        const keyPart = addQuotes ? `"\\"${f.name}\\\":\\""` : `"\\"${f.name}\\":"`;
        return `    o.${f.name}?.let { parts.add(${keyPart} + ${optValExpr}) }`;
      }
      const quotedValExpr = addQuotes ? `${valExpr} + "\\\""` : valExpr;
      const keyPart = addQuotes ? `"\\"${f.name}\\\":\\""` : `"\\"${f.name}\\":"`;
      return `    parts.add(${keyPart} + ${quotedValExpr})`;
    }).join('\n');
    return `fun dump${name}(o: ${name}): String {
    val parts = mutableListOf<String>()
${lines}
    return "{" + parts.joinToString(",") + "}"
}`;
  }).join('\n');
  
  return `// Generated by gen_types.cjs. DO NOT EDIT.
package alltypes
import java.util.Base64

fun _ds(v: String): String {
    val b = StringBuilder()
    b.append('"')
    for (c in v) {
        when (c) {
            '"' -> b.append("\\\\\\"")
            '\\\\' -> b.append("\\\\\\\\")
            '\\n' -> b.append("\\\\n")
            '\\t' -> b.append("\\\\t")
            '\\r' -> b.append("\\\\r")
            else -> if (c.code < 32) b.append("\\\\u%04x".format(c.code)) else b.append(c)
        }
    }
    b.append('"')
    return b.toString()
}

fun _dn(v: Double): String {
    if (v == 0.0 && v < 0) return "-0"
    val s = v.toString()
    return if (s.endsWith(".0")) s.dropLast(2) else s
}
fun _dnf(v: Float): String = _dn(v.toDouble())

fun _di(v: Long): String = "\\\"" + v.toString() + "\\\""
fun _du(v: ULong): String = "\\\"" + v.toString() + "\\\""
fun _db(v: ByteArray): String = Base64.getEncoder().encodeToString(v)

${dumps}
`;
}

function generateDartDump(models) {
  const dumps = Object.entries(models).map(([name, m]) => {
    const lines = m.fields.map(f => {
      let valExpr;
      if (f.isArray) {
        if (f.isModel) {
          valExpr = `'[' + o.${f.name}.map((e) => dump${f.type}(e)).join(',') + ']'`;
        } else if (f.type === 'string') {
          valExpr = `'[' + o.${f.name}.map((e) => _ds(e)).join(',') + ']'`;
        } else if (f.type === 'boolean') {
          valExpr = `'[' + o.${f.name}.map((e) => e ? 'true' : 'false').join(',') + ']'`;
        } else if (f.type === 'bytes') {
          valExpr = `'[' + o.${f.name}.map((e) => '"'+_db(e)+'"').join(',') + ']'`;
        } else if (f.type === 'int64') {
          valExpr = `'[' + o.${f.name}.map((e) => _di(e)).join(',') + ']'`;
        } else if (f.type === 'uint64') {
          valExpr = `'[' + o.${f.name}.map((e) => _du(e)).join(',') + ']'`;
        } else if (f.type === 'float32' || f.type === 'float64') {
          valExpr = `'[' + o.${f.name}.map((e) => _dn(e)).join(',') + ']'`;
        } else {
          valExpr = `'[' + o.${f.name}.map((e) => e.toString()).join(',') + ']'`;
        }
      } else if (f.isModel) {
        valExpr = `dump${f.type}(o.${f.name})`;
      } else if (f.type === 'string') {
        valExpr = `_ds(o.${f.name})`;
      } else if (f.type === 'boolean') {
        valExpr = `(o.${f.name} ? 'true' : 'false')`;
      } else if (f.type === 'bytes') {
        valExpr = `'"' + _db(o.${f.name}) + '"'`;
      } else if (f.type === 'int64') {
        valExpr = `_di(o.${f.name})`;
      } else if (f.type === 'uint64') {
valExpr = `_du(o.${f.name})`;
      } else if (f.type === 'float32' || f.type === 'float64') {
        valExpr = `_dn(o.${f.name})`;
      } else {
        valExpr = `o.${f.name}.toString()`;
      }
      
      if (f.optional) {
        const regex = new RegExp(`o\\.${f.name}`, 'g');
        return `  if (o.${f.name} != null) { parts.add('"${f.name}":' + ${valExpr.replace(regex, `o.${f.name}!`)}); }`;
      }
      return `  parts.add('"${f.name}":' + ${valExpr});`;
    }).join('\n');
    return `String dump${name}(${name} o) {
  final parts = <String>[];
${lines}
  return '{' + parts.join(',') + '}';
}`;
  }).join('\n');
  
  return `// Generated by gen_types.cjs. DO NOT EDIT.
import 'dart:convert';
import 'dart:typed_data';
import '../lib/test_service_types.dart';

String _ds(String v) {
  final b = StringBuffer();
  b.write('"');
  for (final c in v.runes) {
    if (c == 0x22) b.write('\\\\"');
    else if (c == 0x5C) b.write('\\\\\\\\');
    else if (c == 0x0A) b.write('\\\\n');
    else if (c == 0x09) b.write('\\\\t');
    else if (c == 0x0D) b.write('\\\\r');
    else if (c < 0x20) b.write('\\\\u' + c.toRadixString(16).padLeft(4, '0'));
    else b.writeCharCode(c);
  }
  b.write('"');
  return b.toString();
}

String _dn(double v) {
  if (v == 0.0 && (1 / v).isNegative) return '-0';
  final s = v.toString();
  if (s.endsWith('.0')) return s.substring(0, s.length - 2);
  return s;
}

String _di(int v) => '"' + v.toString() + '"';
String _du(int v) => '"' + v.toString() + '"';
String _db(Uint8List v) => base64.encode(v);

${dumps}
`;
}

function generateSwiftDump(models) {
  const dumps = Object.entries(models).map(([name, m]) => {
    const lines = m.fields.map(f => {
      let valExpr;
      let addQuotes = false;
      if (f.isArray) {
        if (f.isModel) {
          valExpr = `"[" + o.${f.name}.map { dump${f.type}($0) }.joined(separator: ",") + "]"`;
        } else if (f.type === 'string') {
          valExpr = `"[" + o.${f.name}.map { _ds($0) }.joined(separator: ",") + "]"`;
        } else if (f.type === 'boolean') {
          valExpr = `"[" + o.${f.name}.map { $0 ? "true" : "false" }.joined(separator: ",") + "]"`;
        } else if (f.type === 'bytes') {
          valExpr = `"[" + o.${f.name}.map { "\\\"" + _db($0) + "\\\"" }.joined(separator: ",") + "]"`;
        } else if (f.type === 'int64') {
          valExpr = `"[" + o.${f.name}.map { _di($0) }.joined(separator: ",") + "]"`;
        } else if (f.type === 'uint64') {
          valExpr = `"[" + o.${f.name}.map { _du($0) }.joined(separator: ",") + "]"`;
        } else if (f.type === 'float32' || f.type === 'float64') {
          valExpr = f.type === 'float32' ? `"[" + o.${f.name}.map { _dnf($0) }.joined(separator: ",") + "]"` : `"[" + o.${f.name}.map { _dn($0) }.joined(separator: ",") + "]"`;
        } else {
          valExpr = `"[" + o.${f.name}.map { String($0) }.joined(separator: ",") + "]"`;
        }
      } else if (f.isModel) {
        valExpr = `dump${f.type}(o.${f.name})`;
      } else if (f.type === 'string') {
        valExpr = `_ds(o.${f.name})`;
      } else if (f.type === 'boolean') {
        valExpr = `(o.${f.name} ? "true" : "false")`;
      } else if (f.type === 'bytes') {
        addQuotes = true;
        valExpr = `_db(o.${f.name})`;
      } else if (f.type === 'int64') {
        valExpr = `_di(o.${f.name})`;
      } else if (f.type === 'uint64') {
        valExpr = `_du(o.${f.name})`;
      } else if (f.type === 'float32' || f.type === 'float64') {
        valExpr = f.type === 'float32' ? `_dnf(o.${f.name})` : `_dn(o.${f.name})`;
      } else {
        valExpr = `String(o.${f.name})`;
      }
      
      if (f.optional) {
        const regex = new RegExp(`o\\.${f.name}`, 'g');
        const optValExpr = addQuotes ? `"\\\"" + ${valExpr.replace(regex, 'v')} + "\\\""` : valExpr.replace(regex, 'v');
        return `    if let v = o.${f.name} { parts.append("\\\"${f.name}\\\": " + ${optValExpr}) }`;
      }
      const quotedValExpr = addQuotes ? `"\\\"" + ${valExpr} + "\\\""` : valExpr;
      return `    parts.append("\\\"${f.name}\\\": " + ${quotedValExpr})`;
    }).join('\n');
    return `func dump${name}(_ o: ${name}) -> String {
    var parts: [String] = []
${lines}
    return "{" + parts.joined(separator: ",") + "}"
}`;
  }).join('\n');
  
  return `// Generated by gen_types.cjs. DO NOT EDIT.
import Foundation

func _ds(_ v: String) -> String {
    var r = ""
    r.append("\\\"")
    for c in v {
        switch c {
        case "\\\"": r.append("\\\\\\\"")
        case "\\\\": r.append("\\\\\\\\")
        case "\\n": r.append("\\\\n")
        case "\\t": r.append("\\\\t")
        case "\\r": r.append("\\\\r")
        default: if c.asciiValue! < 32 { r.append("\\\\u" + String(format: "%04x", c.asciiValue!)) } else { r.append(c) }
        }
    }
    r.append("\\\"")
    return r
}

func _dn(_ v: Double) -> String {
    if v == 0.0 && v < 0 { return "-0" }
    let s = String(v)
    return s.hasSuffix(".0") ? String(s.dropLast(2)) : s
}
func _dnf(_ v: Float) -> String { return _dn(Double(v)) }

func _di(_ v: Int64) -> String { return "\\\""+String(v)+"\\\"" }
func _du(_ v: UInt64) -> String { return "\\""+String(v)+"\\"" }
func _db(_ v: Data) -> String { return v.base64EncodedString() }

${dumps}
`;
}

function generateEmitRunners(testModels, models) {
  fs.mkdirSync(path.join(BASE, 'emit_ts', 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(BASE, 'emit_ts', 'src', 'run_emit.ts'),
    generateTsRunner(testModels, models));
  fs.writeFileSync(
    path.join(BASE, 'emit_ts', 'src', 'dump_emit.ts'),
    generateTsDump(models));

  fs.mkdirSync(path.join(BASE, 'emit_py'), { recursive: true });
  fs.writeFileSync(
    path.join(BASE, 'emit_py', 'run_emit.py'),
    generatePyRunner(testModels, models));
  fs.writeFileSync(
    path.join(BASE, 'emit_py', 'dump_emit.py'),
    generatePyDump(models));

  fs.mkdirSync(path.join(BASE, 'emit_rust', 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(BASE, 'emit_rust', 'src', 'run_emit_map.rs'),
    generateRustRunner(testModels, models));
  fs.writeFileSync(
    path.join(BASE, 'emit_rust', 'src', 'dump_emit.rs'),
    generateRustDump(models));

  fs.mkdirSync(path.join(BASE, 'emit_go'), { recursive: true });
  fs.writeFileSync(
    path.join(BASE, 'emit_go', 'run_emit_map.go'),
    generateGoRunner(testModels, models));
  fs.writeFileSync(
    path.join(BASE, 'emit_go', 'dump_emit.go'),
    generateGoDump(models));

  fs.mkdirSync(path.join(BASE, 'emit_kotlin', 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(BASE, 'emit_kotlin', 'src', 'run_emit_map.kt'),
    generateKotlinRunner(testModels, models));
  fs.writeFileSync(
    path.join(BASE, 'emit_kotlin', 'src', 'dump_emit.kt'),
    generateKotlinDump(models));

  fs.mkdirSync(path.join(BASE, 'emit_dart', 'bin'), { recursive: true });
  fs.writeFileSync(
    path.join(BASE, 'emit_dart', 'bin', 'run_emit.dart'),
    generateDartRunner(testModels, models));
  fs.writeFileSync(
    path.join(BASE, 'emit_dart', 'bin', 'dump_emit.dart'),
    generateDartDump(models));

  fs.mkdirSync(path.join(BASE, 'emit_swift', 'Sources', 'run_swift'), { recursive: true });
  fs.writeFileSync(
    path.join(BASE, 'emit_swift', 'Sources', 'run_swift', 'run_emit.swift'),
    generateSwiftRunner(testModels, models));
  fs.writeFileSync(
    path.join(BASE, 'emit_swift', 'Sources', 'run_swift', 'dump_emit.swift'),
    generateSwiftDump(models));

  console.log('Generated emit runners for 7 languages.');
}

generateEmitRunners(testModels, models);;
