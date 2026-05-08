import { models, enums, unions } from "./definitions.mjs";

const TEST_STRINGS = ["hello", "world", "test", "foo", "bar", "a\nb", "日本語", "x".repeat(100), "a\x00b"];
const TEST_BYTES = [
  Buffer.from([0xDE, 0xAD, 0xBE, 0xEF]),
  Buffer.from([0x00, 0x01, 0x02]),
  Buffer.from([0xFF]),
  Buffer.alloc(256, 0x42),
  Buffer.alloc(64, 0x00),
  Buffer.alloc(64, 0xFF),
];

export function scalarValue(type, seed) {
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
  if (enums[field.type]) {
    return enums[field.type].members[seed % enums[field.type].members.length].name;
  }
  if (unions[field.type]) {
    const u = unions[field.type];
    const vr = u.variants[seed % u.variants.length];
    let val;
    if (vr.isScalar) {
      val = scalarValue(vr.type, seed);
    } else if (models[vr.type]) {
      val = getInstance(vr.type);
    } else if (unions[vr.type]) {
      const nestedU = unions[vr.type];
      const nvr = nestedU.variants[0];
      val = { [nvr.name]: nvr.isScalar ? scalarValue(nvr.type, seed) : getInstance(nvr.type) };
    }
    return { [vr.name]: val };
  }
  return scalarValue(field.type, seed);
}

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

export function getInstance(name) {
  if (name in EDGE_INSTANCES) return EDGE_INSTANCES[name];
  const m = models[name];
  if (m.fields.length === 0) return {};
  return genInstance(name);
}
