import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { encode as mpEncode, decode as mpDecode } from "@msgpack/msgpack";
import { JsonWriter, GronWriter, MsgPackWriter } from "@specodec/specodec-ts";

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

for (const [name, { value, type }] of Object.entries(scalars)) {
  if (type === "float32") {
    const buf = Buffer.allocUnsafe(5);
    buf[0] = 0xCA;
    new DataView(buf.buffer, buf.byteOffset, buf.byteLength).setFloat32(1, value, false);
    fs.writeFileSync(path.join(VEC, "scalars", name + ".mp"), buf);
  } else {
    fs.writeFileSync(path.join(VEC, "scalars", name + ".mp"), mpEncode(value, mpOpts));
  }
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

function specodecMsgPack(data, modelName) {
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
      case "int64": w.writeInt64(BigInt(val)); break;
      case "uint8": case "uint16": case "uint32": w.writeUint32(val); break;
      case "uint64": w.writeUint64(BigInt(val)); break;
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
  
  const w = new MsgPackWriter();
  encodeObj(data, w, modelName);
  return w.toBytes();
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
  fs.writeFileSync(path.join(VEC, name + ".msgpack"), specodecMsgPack(data, name));
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

