import { Buffer } from 'node:buffer';
import type { FieldDef, ModelDef } from './gen.ts';
import { models } from './gen.ts';

export const TEST_STRINGS = ['hello', 'world', 'test', 'foo', 'bar', 'a\nb', '日本語', 'x'.repeat(100), 'a\x00b'];
export const TEST_BYTES = [
  Buffer.from([0xDE, 0xAD, 0xBE, 0xEF]),
  Buffer.from([0x00, 0x01, 0x02]),
  Buffer.from([0xFF]),
  Buffer.alloc(256, 0x42),
  Buffer.alloc(64, 0x00),
  Buffer.alloc(64, 0xFF),
];

export const scalars: Record<string, { value: unknown, type: string }> = {
  'int8_min':    { value: -128,                    type: 'int32' },
  'int8_max':    { value: 127,                     type: 'int32' },
  'int16_min':   { value: -32768,                  type: 'int32' },
  'int16_max':   { value: 32767,                   type: 'int32' },
  'int32_min':   { value: -2147483648,             type: 'int32' },
  'int32_max':   { value: 2147483647,              type: 'int32' },
  'int64_min':   { value: BigInt('-9223372036854775808'), type: 'int64' },
  'int64_max':   { value: BigInt('9223372036854775807'),  type: 'int64' },
  'uint8_max':   { value: 255,                     type: 'uint32' },
  'uint16_max':  { value: 65535,                   type: 'uint32' },
  'uint32_max':  { value: 4294967295,              type: 'uint32' },
  'uint64_max':  { value: BigInt('18446744073709551615'), type: 'uint64' },
  'float32_1.5': { value: 1.5,                     type: 'float32' },
  'float32_neg_zero': { value: -0.0,               type: 'float32' },
  'float64_pi':  { value: 3.14159265358979,        type: 'float64' },
  'float64_neg_zero': { value: -0.0,               type: 'float64' },
  'str_empty':   { value: '',                      type: 'string' },
  'str_ascii':   { value: 'hello',                 type: 'string' },
  'str_null_byte': { value: 'a\x00b',              type: 'string' },
  'str_escape':  { value: 'a\nb\tc\"d\\e',         type: 'string' },
  'str_unicode': { value: '你好世界🌍',            type: 'string' },
  'str_31':      { value: 'x'.repeat(31),           type: 'string' },
  'str_32':      { value: 'x'.repeat(32),           type: 'string' },
  'str_255':     { value: 'x'.repeat(255),          type: 'string' },
  'str_256':     { value: 'x'.repeat(256),          type: 'string' },
  'bytes_empty': { value: Buffer.alloc(0),          type: 'bytes' },
  'bytes_small': { value: Buffer.from([0, 1, 127, 255]), type: 'bytes' },
  'bytes_31':    { value: Buffer.alloc(31, 0x42),   type: 'bytes' },
  'bytes_32':    { value: Buffer.alloc(32, 0x42),   type: 'bytes' },
  'bytes_255':   { value: Buffer.alloc(255, 0x42),  type: 'bytes' },
  'bytes_256':   { value: Buffer.alloc(256, 0x42),  type: 'bytes' },
  'bytes_zeros': { value: Buffer.alloc(64, 0x00),   type: 'bytes' },
  'bytes_ff':    { value: Buffer.alloc(64, 0xFF),   type: 'bytes' },
  'bool_true':   { value: true,                     type: 'bool' },
  'bool_false':  { value: false,                    type: 'bool' },
};

export function scalarValue(type: string, seed: number): unknown {
  switch (type) {
    case 'string': return TEST_STRINGS[seed % TEST_STRINGS.length];
    case 'boolean': return seed % 2 === 0;
    case 'int8': return [-42, 0, 127, -128][seed % 4];
    case 'int16': return [-1000, 0, 32767, -32768][seed % 4];
    case 'int32': return [-100000, 0, 2147483647, -2147483648][seed % 4];
    case 'int64': return [BigInt('-9000000000'), BigInt('1'), BigInt('9223372036854775807'), BigInt('-9223372036854775808')][seed % 4];
    case 'uint8': return [0, 128, 200, 255][seed % 4];
    case 'uint16': return [0, 10000, 50000, 65535][seed % 4];
    case 'uint32': return [0, 1000000000, 3000000000, 4294967295][seed % 4];
    case 'uint64': return [BigInt('1'), BigInt('9000000000'), BigInt('16000000000000000000'), BigInt('18446744073709551615')][seed % 4];
    case 'float32': return [3.14, -1.5, 0.0, -0.0][seed % 4];
    case 'float64': return [2.718281828, -3.14159265358979, 0.0, -0.0][seed % 4];
    case 'bytes': return TEST_BYTES[seed % TEST_BYTES.length];
    default: throw new Error(`unknown scalar type: ${type}`);
  }
}

export function genInstance(modelName: string, depth: number = 0): Record<string, unknown> | null {
  if (depth > 4) return null;
  const m = models[modelName];
  if (!m) throw new Error(`unknown model: ${modelName}`);
  const obj: Record<string, unknown> = {};
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

export function genFieldValue(field: FieldDef, depth: number, seed: number): unknown {
  if (field.isArray) {
    const len = 1 + (seed % 3);
    const arr: unknown[] = [];
    for (let i = 0; i < len; i++) {
      arr.push(genSingleValue(field, depth, seed + i));
    }
    return arr;
  }
  return genSingleValue(field, depth, seed);
}

export function genSingleValue(field: FieldDef, depth: number, seed: number): unknown {
  if (field.isModel) {
    return genInstance(field.type, depth + 1);
  }
  return scalarValue(field.type, seed);
}

export const EDGE_INSTANCES: Record<string, Record<string, unknown>> = {
  'EdgeBigNums': {
    i8: -128, i16: -32768, i32: -2147483648, i64: BigInt('-9223372036854775808'),
    u8: 255, u16: 65535, u32: 4294967295, u64: BigInt('18446744073709551615')
  },
  'EdgeNegZero': { v: -0.0 },
  'EdgeNullByte': { s: 'a\x00b\x00c', b: Buffer.from([0x00, 0x01, 0x00, 0xFF]) },
  'EdgeBoundary': {
    i32_neg129: -129, i32_128: 128, i32_256: 256, i32_65536: 65536,
    i32_neg32769: -32769, u32_65536: 65536
  },
  'EdgeStrLen': {
    s31: 'a'.repeat(31), s32: 'b'.repeat(32), s255: 'c'.repeat(255), s256: 'd'.repeat(256)
  },
  'EdgeBytesLen': {
    b31: Buffer.alloc(31, 0xAA), b32: Buffer.alloc(32, 0xBB),
    b255: Buffer.alloc(255, 0xCC), b256: Buffer.alloc(256, 0xDD)
  },
  'EdgeArrEmpty': { items: [] },
  'EdgeArrBoundary': {
    a15: Array.from({ length: 15 }, (_, i) => i),
    a16: Array.from({ length: 16 }, (_, i) => i)
  },
  'AllOpt1': {},
  'EdgeOneOpt': {},
  'EdgeNullable': {},
  'NestOptInner1': { tag: 'empty' },
  'NestOptInner3': {},
  'OptArr3': {},
  'OptSingleString': {},
  'OptSingleInt32': {},
  'OptSingleBoolean': {},
};

