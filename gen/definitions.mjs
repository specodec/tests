const SCALARS = ["string","boolean","int8","int16","int32","int64",
                 "uint8","uint16","uint32","uint64","float32","float64","bytes"];
const SCALAR_SET = new Set(SCALARS);

export { SCALARS, SCALAR_SET };

export function isScalarType(t) { return SCALAR_SET.has(t); }

const models = {};
const modelOrder = [];
let _ns = "AllTypes";

function setNs(ns) { _ns = ns; }

function addM(name, fields, opts = {}) {
  if (models[name]) throw new Error(`duplicate model: ${name}`);
  models[name] = { name, fields, recursive: !!opts.recursive, namespace: _ns };
  modelOrder.push(name);
}

const unionOrder = [];
const unions = {};

function addU(name, variants) {
  unionOrder.push(name);
  unions[name] = { name, variants: variants.map(v => ({ name: v[0], type: v[1], isScalar: isScalarType(v[1]) })), namespace: _ns };
}
function v(name, type) { return [name, type]; }

const enumOrder = [];
const enums = {};
function addE(name, members) {
  enumOrder.push(name);
  enums[name] = { name, members: members.map((m, i) => typeof m === "string" ? { name: m, value: i } : m), namespace: _ns };
}

function f(name, type, extra = {}) {
  return { name, type, ...extra };
}

// ═══════════════════════════════════════════
// Sub-models (shared building blocks)
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
// Scalars
// ═══════════════════════════════════════════

setNs("AllTypes.Scalars");
for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM("Single" + cap, [f("v", sc)]);
}

// ═══════════════════════════════════════════
// Optional
// ═══════════════════════════════════════════

setNs("AllTypes.Opt");
for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM("OptSingle" + cap, [f("v", sc, { optional: true })]);
}

// ═══════════════════════════════════════════
// Pairs + Duals
// ═══════════════════════════════════════════

setNs("AllTypes.Pairs");
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

// ═══════════════════════════════════════════
// Many (Fives + Tens)
// ═══════════════════════════════════════════

setNs("AllTypes.Many");
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

// ═══════════════════════════════════════════
// Arrays
// ═══════════════════════════════════════════

setNs("AllTypes.Arrays");
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

// ═══════════════════════════════════════════
// Nests
// ═══════════════════════════════════════════

setNs("AllTypes.Nests");
for (const sub of SUB_MODELS) {
  addM("Nest" + sub, [f("nested", sub, { isModel: true })]);
}

for (const sub of SUB_MODELS) {
  addM("OptNest" + sub, [f("label","string"), f("nested", sub, { optional: true, isModel: true })]);
}

// ═══════════════════════════════════════════
// Mixed (ModelArr + Mix)
// ═══════════════════════════════════════════

setNs("AllTypes.Mixed");
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

// ═══════════════════════════════════════════
// Recursive
// ═══════════════════════════════════════════

setNs("AllTypes.Recursive");
addM("RecList",   [f("value","int32"), f("next","RecList",{optional:true,isModel:true})], {recursive:true});
addM("RecTree",   [f("value","string"), f("left_node","RecTree",{optional:true,isModel:true}), f("right_node","RecTree",{optional:true,isModel:true})], {recursive:true});
addM("RecChain",  [f("id","int32"), f("label","string"), f("next","RecChain",{optional:true,isModel:true})], {recursive:true});
addM("RecWrap",   [f("payload","bytes"), f("nested","RecWrap",{optional:true,isModel:true})], {recursive:true});
addM("RecWide",   [f("a","int32"), f("b","string"), f("c","float64"), f("child","RecWide",{optional:true,isModel:true})], {recursive:true});

// ═══════════════════════════════════════════
// Wide models
// ═══════════════════════════════════════════

setNs("AllTypes.Wide");
for (let w = 0; w < 5; w++) {
  const fields = [];
  const n = 20 + w * 5;
  for (let j = 0; j < n; j++) {
    const sc = SCALARS[(w * 7 + j) % SCALARS.length];
    fields.push(f("f" + (j + 1), sc));
  }
  addM("Wide" + String(n), fields);
}

// ═══════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════

setNs("AllTypes.Edge");
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

// ═══════════════════════════════════════════
// Extra (OptArr + NestOpt + DeepNest + Timestamp + Config + NestedSimple + DeepModel)
// ═══════════════════════════════════════════

setNs("AllTypes.Extra");
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

const NESTED_MODELS = {
  "NestedSimple": { namespace: ["nested"], fields: [f("name","string"), f("value","int32")] },
  "DeepModel": { namespace: ["nested","deep"], fields: [f("payload","bytes"), f("count","int64")] },
};
const NESTED_ORDER = Object.keys(NESTED_MODELS);
for (const name of NESTED_ORDER) {
  addM(name, NESTED_MODELS[name].fields);
  const nsPath = NESTED_MODELS[name].namespace.join(".");
  models[name].namespace = `AllTypes.${nsPath}`;
}

// ═══════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════

setNs("AllTypes.Enums");
addE("Color",    ["Red", "Green", "Blue"]);
addE("Priority", ["Low", "Medium", "High", "Critical"]);
addE("Status",   ["Active", "Inactive", "Pending", "Archived"]);

// ═══════════════════════════════════════════
// Unions
// ═══════════════════════════════════════════

setNs("AllTypes.Unions");
addU("Shape",     [v("circle", "Coord"),  v("rect", "Range32")]);
addU("Ident",     [v("name", "string"),   v("number", "int32")]);
addU("ResultMsg", [v("ok", "string"),     v("err", "Label")]);
addU("Tagged",    [v("tag", "string"),    v("score", "float64"), v("active", "boolean")]);
addU("OptUnionHolder", [v("shape", "Shape"), v("id", "Ident")]);
addU("MixedUnion",     [v("point", "Coord"), v("label", "string"), v("count", "int32")]);
addU("NestedUnion",    [v("result", "ResultMsg"), v("shape", "Shape")]);
addU("ScalarUnion",    [v("s", "string"), v("i", "int32"), v("f", "float64"), v("b", "boolean")]);

// Models that hold enums
setNs("AllTypes.Enums");
addM("EnumHolder",       [f("color","Color"), f("priority","Priority"), f("status","Status")]);
addM("OptEnumHolder",    [f("color","Color",{optional:true}), f("priority","Priority",{optional:true})]);
addM("EnumArrayHolder",  [f("colors","Color",{isArray:true})]);
addM("EnumMixedHolder",  [f("status","Status"), f("name","string"), f("count","int32"), f("active","boolean")]);

const testModels = modelOrder.filter(n => !SUB_MODELS.includes(n));

console.log(`Total models: ${modelOrder.length}`);
console.log(`Total unions: ${unionOrder.length}`);
console.log(`Total enums: ${enumOrder.length}`);
console.log(`Test models: ${testModels.length}`);

export { models, modelOrder, unions, unionOrder, enums, enumOrder, SUB_MODELS, testModels };
