export type ScalarType = 'string' | 'boolean' | 'int8' | 'int16' | 'int32' | 'int64' | 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'float32' | 'float64' | 'bytes';

export interface FieldDef {
  name: string;
  type: ScalarType | string;
  optional?: boolean;
  isArray?: boolean;
  isRecord?: boolean;
  isModel?: boolean;
}

export interface ModelDef {
  name: string;
  fields: FieldDef[];
  recursive?: boolean;
}

export const SCALARS: ScalarType[] = ['string', 'boolean', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float32', 'float64', 'bytes'];

export const SUB_MODELS = ['Inner', 'Coord', 'IdVal', 'Label', 'Money', 'Range32', 'Addr', 'Point3'];

export const models: Record<string, ModelDef> = {};
export const modelOrder: string[] = [];

export function addM(name: string, fields: FieldDef[], opts: { recursive?: boolean } = {}): void {
  if (models[name]) throw new Error(`duplicate model: ${name}`);
  models[name] = { name, fields, recursive: opts.recursive ?? false };
  modelOrder.push(name);
}

export function f(name: string, type: string, extra: Partial<FieldDef> = {}): FieldDef {
  return { name, type, ...extra };
}

// ═══════════════════════════════════════════
// Sub-models (used in nested structures)
// ═══════════════════════════════════════════

addM('Inner', [f('x', 'int32'), f('y', 'int32')]);
addM('Coord', [f('lat', 'float64'), f('lng', 'float64')]);
addM('IdVal', [f('id', 'string'), f('value', 'int32')]);
addM('Label', [f('key', 'string'), f('text', 'string')]);
addM('Money', [f('amount', 'int64'), f('currency', 'string')]);
addM('Range32', [f('min', 'int32'), f('max', 'int32')]);
addM('Addr', [f('street', 'string'), f('city', 'string'), f('zip', 'string')]);
addM('Point3', [f('x', 'float64'), f('y', 'float64'), f('z', 'float64')]);
addM('OptInner', [f('name', 'string', { optional: true }), f('score', 'float64', { optional: true }), f('tag', 'string', { optional: true })]);

// ═══════════════════════════════════════════
// Single scalar models
// ═══════════════════════════════════════════

for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM(`Single${cap}`, [f('v', sc)]);
}

for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM(`OptSingle${cap}`, [f('v', sc, { optional: true })]);
}

for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM(`Pair${cap}`, [f('a', sc), f('b', sc)]);
}

// ═══════════════════════════════════════════
// Dual scalar pairs
// ═══════════════════════════════════════════

const DPAIRS: [string, string][] = [
  ['string', 'int32'], ['string', 'boolean'], ['string', 'float64'], ['string', 'bytes'],
  ['int32', 'boolean'], ['int32', 'float64'], ['int32', 'int64'], ['int32', 'uint32'],
  ['int64', 'uint64'], ['float32', 'float64'], ['float64', 'boolean'], ['float64', 'bytes'],
  ['uint32', 'uint64'], ['boolean', 'bytes'], ['int8', 'uint8'], ['int16', 'uint16'],
  ['string', 'int64'], ['string', 'uint64'], ['int32', 'bytes'], ['float64', 'int32'],
  ['boolean', 'int32'], ['bytes', 'int64'], ['int8', 'float32'], ['uint8', 'int16'],
  ['int64', 'float64'], ['uint64', 'string']
];

for (let i = 0; i < DPAIRS.length; i++) {
  const [t1, t2] = DPAIRS[i];
  const cap1 = t1.charAt(0).toUpperCase() + t1.slice(1);
  const cap2 = t2.charAt(0).toUpperCase() + t2.slice(1);
  addM(`Dual${cap1}${cap2}`, [f('a', t1), f('b', t2)]);
}

// ═══════════════════════════════════════════
// Triple scalar models
// ═══════════════════════════════════════════

const TRIPLES: string[][] = [
  ['string', 'int32', 'boolean'],
  ['float64', 'float64', 'float64'],
  ['int32', 'int32', 'int32'],
  ['string', 'string', 'int32'],
  ['int64', 'string', 'boolean'],
  ['uint32', 'uint64', 'string'],
  ['bytes', 'string', 'int32'],
  ['float32', 'int32', 'boolean'],
  ['string', 'int64', 'float64'],
  ['boolean', 'boolean', 'boolean'],
  ['int8', 'int16', 'int32'],
  ['uint8', 'uint16', 'uint32'],
  ['string', 'bytes', 'float64'],
  ['int64', 'uint64', 'boolean'],
  ['float64', 'string', 'bytes']
];

for (let i = 0; i < TRIPLES.length; i++) {
  const types = TRIPLES[i];
  const fields = types.map((t, j) => f(String.fromCharCode(97 + j), t));
  addM(`Triple${String(i + 1).padStart(2, '0')}`, fields);
}

// ═══════════════════════════════════════════
// Five-field models
// ═══════════════════════════════════════════

const QUINCS: string[][] = [
  ['string', 'int32', 'boolean', 'float64', 'bytes'],
  ['int32', 'int32', 'int32', 'int32', 'int32'],
  ['string', 'string', 'string', 'string', 'string'],
  ['float64', 'int32', 'string', 'boolean', 'bytes'],
  ['int64', 'uint64', 'string', 'float32', 'int32'],
  ['boolean', 'string', 'int32', 'float64', 'uint32'],
  ['bytes', 'bytes', 'string', 'int32', 'float64'],
  ['uint8', 'uint16', 'uint32', 'int8', 'int16'],
  ['float32', 'float64', 'int32', 'int64', 'string'],
  ['string', 'boolean', 'int64', 'uint64', 'float64']
];

for (let i = 0; i < QUINCS.length; i++) {
  const types = QUINCS[i];
  const fields = types.map((t, j) => f(`f${j + 1}`, t));
  addM(`Five${String(i + 1).padStart(2, '0')}`, fields);
}

// ═══════════════════════════════════════════
// Ten-field models
// ═══════════════════════════════════════════

for (let g = 0; g < 5; g++) {
  const fields: FieldDef[] = [];
  for (let j = 0; j < 10; j++) {
    const sc = SCALARS[(g * 3 + j) % SCALARS.length];
    fields.push(f(`f${j + 1}`, sc));
  }
  addM(`Ten${String(g + 1).padStart(2, '0')}`, fields);
}

// ═══════════════════════════════════════════
// Array models
// ═══════════════════════════════════════════

const ARR_SCALARS = ['string', 'int32', 'boolean', 'float64', 'bytes', 'int64', 'uint64'];

for (const sc of ARR_SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM(`Arr${cap}`, [f('items', sc, { isArray: true })]);
}

addM('MultiArr1', [f('names', 'string', { isArray: true }), f('scores', 'int32', { isArray: true })]);
addM('MultiArr2', [f('flags', 'boolean', { isArray: true }), f('values', 'float64', { isArray: true }), f('payload', 'bytes', { isArray: true })]);
addM('MultiArr3', [f('a', 'string', { isArray: true }), f('b', 'int32', { isArray: true }), f('c', 'float64', { isArray: true })]);
addM('MultiArr4', [f('ids', 'int64', { isArray: true }), f('tags', 'string', { isArray: true })]);
addM('MultiArr5', [f('xs', 'uint64', { isArray: true }), f('ys', 'float32', { isArray: true }), f('zs', 'boolean', { isArray: true })]);

// ═══════════════════════════════════════════
// Optional combo models
// ═══════════════════════════════════════════

addM('OptCombo1', [f('req', 'string'), f('opt_a', 'int32', { optional: true })]);
addM('OptCombo2', [f('req', 'string'), f('opt_a', 'int32', { optional: true }), f('opt_b', 'boolean', { optional: true })]);
addM('OptCombo3', [f('req', 'string'), f('opt_a', 'int32', { optional: true }), f('opt_b', 'boolean', { optional: true }), f('opt_c', 'float64', { optional: true })]);
addM('OptCombo4', [f('req', 'int32'), f('opt_a', 'string', { optional: true }), f('opt_b', 'bytes', { optional: true })]);
addM('OptCombo5', [f('req1', 'string'), f('req2', 'int32'), f('opt_a', 'boolean', { optional: true }), f('opt_b', 'float64', { optional: true })]);
addM('OptCombo6', [f('req', 'string'), f('opt_s', 'string', { optional: true }), f('opt_i', 'int32', { optional: true }), f('opt_f', 'float64', { optional: true }), f('opt_b', 'bytes', { optional: true })]);
addM('OptCombo7', [f('req', 'int64'), f('opt_u64', 'uint64', { optional: true }), f('opt_str', 'string', { optional: true })]);
addM('OptCombo8', [f('a', 'string'), f('b', 'int32', { optional: true }), f('c', 'float64', { optional: true }), f('d', 'boolean', { optional: true }), f('e', 'bytes', { optional: true }), f('f', 'int64', { optional: true })]);
addM('OptCombo9', [f('id', 'string'), f('name', 'string', { optional: true }), f('age', 'int32', { optional: true }), f('score', 'float64', { optional: true })]);
addM('OptCombo10', [f('code', 'int32'), f('msg', 'string', { optional: true }), f('detail', 'string', { optional: true }), f('retry', 'boolean', { optional: true })]);

// ═══════════════════════════════════════════
// Nested sub-model models
// ═══════════════════════════════════════════

for (const sub of SUB_MODELS) {
  addM(`Nest${sub}`, [f('nested', sub, { isModel: true })]);
}

for (const sub of SUB_MODELS) {
  addM(`OptNest${sub}`, [f('label', 'string'), f('nested', sub, { optional: true, isModel: true })]);
}

// ═══════════════════════════════════════════
// Model array models
// ═══════════════════════════════════════════

addM('ModelArr1', [f('points', 'Inner', { isArray: true, isModel: true })]);
addM('ModelArr2', [f('coords', 'Coord', { isArray: true, isModel: true })]);
addM('ModelArr3', [f('items', 'IdVal', { isArray: true, isModel: true }), f('tag', 'string')]);
addM('ModelArr4', [f('labels', 'Label', { isArray: true, isModel: true }), f('count', 'int32')]);
addM('ModelArr5', [f('arr', 'Money', { isArray: true, isModel: true }), f('bs', 'Addr', { isArray: true, isModel: true })]);

// ═══════════════════════════════════════════
// Mixed models
// ═══════════════════════════════════════════

addM('Mix01', [f('name', 'string'), f('value', 'int32'), f('point', 'Inner', { isModel: true })]);
addM('Mix02', [f('id', 'string'), f('loc', 'Coord', { isModel: true }), f('tags', 'string', { isArray: true })]);
addM('Mix03', [f('label', 'string'), f('value_range', 'Range32', { isModel: true }), f('active', 'boolean')]);
addM('Mix04', [f('title', 'string'), f('price', 'Money', { isModel: true }), f('inStock', 'boolean'), f('rating', 'float64')]);
addM('Mix05', [f('addr', 'Addr', { isModel: true }), f('coords', 'Coord', { isArray: true, isModel: true })]);
addM('Mix06', [f('name', 'string'), f('age', 'int32'), f('address', 'Addr', { optional: true, isModel: true }), f('email', 'string', { optional: true })]);
addM('Mix07', [f('origin', 'Point3', { isModel: true }), f('dest', 'Point3', { isModel: true }), f('distance', 'float64')]);
addM('Mix08', [f('keys', 'string', { isArray: true }), f('values', 'int32', { isArray: true }), f('meta', 'Label', { optional: true, isModel: true })]);
addM('Mix09', [f('id', 'int64'), f('payload', 'bytes'), f('checksum', 'uint32'), f('prev', 'IdVal', { optional: true, isModel: true })]);
addM('Mix10', [f('items', 'string', { isArray: true }), f('total', 'int32'), f('avg', 'float64'), f('value_range', 'Range32', { isModel: true })]);
addM('Mix11', [f('name', 'string'), f('values', 'float64', { isArray: true }), f('nested', 'Inner', { optional: true, isModel: true }), f('flag', 'boolean', { optional: true })]);
addM('Mix12', [f('header', 'string'), f('entries', 'IdVal', { isArray: true, isModel: true }), f('footer', 'string', { optional: true })]);
addM('Mix13', [f('a', 'int32'), f('b', 'float64'), f('c', 'string'), f('d', 'boolean'), f('e', 'bytes'), f('nested', 'Inner', { isModel: true })]);
addM('Mix14', [f('amounts', 'Money', { isArray: true, isModel: true }), f('total', 'int64'), f('currency', 'string')]);
addM('Mix15', [f('src_addr', 'Addr', { isModel: true }), f('dst_addr', 'Addr', { isModel: true }), f('distance', 'float64'), f('duration', 'float64')]);

// ═══════════════════════════════════════════
// All optional models
// ═══════════════════════════════════════════

addM('AllOpt1', [f('a', 'string', { optional: true }), f('b', 'int32', { optional: true }), f('c', 'boolean', { optional: true })]);
addM('AllOpt2', [f('x', 'float64', { optional: true }), f('y', 'bytes', { optional: true }), f('z', 'int64', { optional: true })]);
addM('AllOpt3', [f('name', 'string', { optional: true }), f('age', 'int32', { optional: true }), f('score', 'float64', { optional: true }), f('active', 'boolean', { optional: true })]);
addM('AllOpt4', [f('a', 'uint32', { optional: true }), f('b', 'uint64', { optional: true }), f('c', 'int32', { optional: true }), f('d', 'string', { optional: true }), f('e', 'bytes', { optional: true })]);
addM('AllOpt5', [f('p', 'Inner', { optional: true, isModel: true }), f('q', 'string', { optional: true })]);

// ═══════════════════════════════════════════
// Recursive models
// ═══════════════════════════════════════════

addM('RecList', [f('value', 'int32'), f('next', 'RecList', { optional: true, isModel: true })], { recursive: true });
addM('RecTree', [f('value', 'string'), f('left_node', 'RecTree', { optional: true, isModel: true }), f('right_node', 'RecTree', { optional: true, isModel: true })], { recursive: true });
addM('RecChain', [f('id', 'int32'), f('label', 'string'), f('next', 'RecChain', { optional: true, isModel: true })], { recursive: true });
addM('RecWrap', [f('payload', 'bytes'), f('nested', 'RecWrap', { optional: true, isModel: true })], { recursive: true });
addM('RecWide', [f('a', 'int32'), f('b', 'string'), f('c', 'float64'), f('child', 'RecWide', { optional: true, isModel: true })], { recursive: true });

// ═══════════════════════════════════════════
// Wide models (many fields)
// ═══════════════════════════════════════════

for (let w = 0; w < 5; w++) {
  const fields: FieldDef[] = [];
  const n = 20 + w * 5;
  for (let j = 0; j < n; j++) {
    const sc = SCALARS[(w * 7 + j) % SCALARS.length];
    fields.push(f(`f${j + 1}`, sc));
  }
  addM(`Wide${n}`, fields);
}

// ═══════════════════════════════════════════
// Edge case models
// ═══════════════════════════════════════════

addM('EdgeEmpty', []);
addM('EdgeOneOpt', [f('maybe', 'string', { optional: true })]);
addM('EdgeBigNums', [f('i8', 'int8'), f('i16', 'int16'), f('i32', 'int32'), f('i64', 'int64'), f('u8', 'uint8'), f('u16', 'uint16'), f('u32', 'uint32'), f('u64', 'uint64')]);
addM('EdgeZeroVals', [f('s', 'string'), f('i', 'int32'), f('f', 'float64'), f('b', 'boolean'), f('by', 'bytes')]);
addM('EdgeNullable', [f('a', 'string', { optional: true }), f('b', 'int32', { optional: true }), f('c', 'Inner', { optional: true, isModel: true }), f('d', 'string', { optional: true, isArray: true })]);
addM('EdgeNegZero', [f('v', 'float64')]);
addM('EdgeNullByte', [f('s', 'string'), f('b', 'bytes')]);
addM('EdgeBoundary', [f('i32_neg129', 'int32'), f('i32_128', 'int32'), f('i32_256', 'int32'), f('i32_65536', 'int32'), f('i32_neg32769', 'int32'), f('u32_65536', 'uint32')]);
addM('EdgeStrLen', [f('s31', 'string'), f('s32', 'string'), f('s255', 'string'), f('s256', 'string')]);
addM('EdgeBytesLen', [f('b31', 'bytes'), f('b32', 'bytes'), f('b255', 'bytes'), f('b256', 'bytes')]);
addM('EdgeArrEmpty', [f('items', 'string', { isArray: true })]);
addM('EdgeArrBoundary', [f('a15', 'int32', { isArray: true }), f('a16', 'int32', { isArray: true })]);

// ═══════════════════════════════════════════
// Optional array models
// ═══════════════════════════════════════════

addM('OptArr1', [f('req', 'string'), f('items', 'int32', { isArray: true, optional: true })]);
addM('OptArr2', [f('id', 'int32'), f('names', 'string', { isArray: true, optional: true }), f('flags', 'boolean', { isArray: true, optional: true })]);
addM('OptArr3', [f('a', 'string', { isArray: true, optional: true }), f('b', 'float64', { isArray: true, optional: true })]);
addM('OptArr4', [f('payload', 'bytes'), f('chunks', 'bytes', { isArray: true, optional: true })]);
addM('OptArr5', [f('models', 'Inner', { isArray: true, optional: true, isModel: true }), f('name', 'string')]);

// ═══════════════════════════════════════════
// Nested optional models
// ═══════════════════════════════════════════

addM('NestOpt1', [f('outer', 'Label', { isModel: true }), f('name', 'string')]);
addM('NestOpt2', [f('a', 'IdVal', { optional: true, isModel: true }), f('b', 'IdVal', { optional: true, isModel: true }), f('c', 'IdVal', { optional: true, isModel: true })]);
addM('NestOpt3', [f('money', 'Money', { isModel: true }), f('value_range', 'Range32', { optional: true, isModel: true })]);
addM('NestOpt4', [f('addr', 'Addr', { optional: true, isModel: true }), f('coord', 'Coord', { optional: true, isModel: true }), f('name', 'string')]);
addM('NestOpt5', [f('point', 'Point3', { isModel: true }), f('addr', 'Addr', { isModel: true }), f('label', 'Label', { optional: true, isModel: true })]);

addM('NestOptInner1', [f('tag', 'string'), f('nested', 'OptInner', { optional: true, isModel: true })]);
addM('NestOptInner2', [f('tag', 'string'), f('nested', 'OptInner', { isModel: true })]);
addM('NestOptInner3', [f('outer', 'OptInner', { optional: true, isModel: true }), f('nested', 'OptInner', { optional: true, isModel: true })]);

// ═══════════════════════════════════════════
// Deep nested models
// ═══════════════════════════════════════════

addM('DeepNest1', [f('label', 'string'), f('nested', 'Addr', { isModel: true })]);
addM('DeepNest2', [f('name', 'string'), f('money', 'Money', { isModel: true }), f('addr', 'Addr', { isModel: true })]);
addM('DeepNest3', [f('title', 'string'), f('point', 'Point3', { isModel: true }), f('value_range', 'Range32', { isModel: true }), f('money', 'Money', { isModel: true })]);
addM('DeepNest4', [f('coords', 'Coord', { isArray: true, isModel: true }), f('nested', 'Inner', { isModel: true }), f('tag', 'string')]);
addM('DeepNest5', [f('labels', 'Label', { isArray: true, isModel: true }), f('money', 'Money', { isModel: true }), f('name', 'string')]);
addM('DeepNest6', [f('items', 'IdVal', { isArray: true, isModel: true }), f('addr', 'Addr', { optional: true, isModel: true }), f('coord', 'Coord', { isModel: true })]);
addM('DeepNest7', [f('a', 'Addr', { isModel: true }), f('b', 'Addr', { isModel: true }), f('c', 'Addr', { isModel: true })]);

// ═══════════════════════════════════════════
// Record type tests (Record<string, T>)
// ═══════════════════════════════════════════

// Basic Record types
for (const sc of SCALARS) {
  const cap = sc.charAt(0).toUpperCase() + sc.slice(1);
  addM(`Rec${cap}`, [f('data', sc, { isRecord: true })]);
}

// Multiple Record fields
addM('RecMulti1', [f('names', 'string', { isRecord: true }), f('scores', 'int32', { isRecord: true })]);
addM('RecMulti2', [f('flags', 'boolean', { isRecord: true }), f('values', 'float64', { isRecord: true })]);
addM('RecMulti3', [f('a', 'string', { isRecord: true }), f('b', 'int32', { isRecord: true }), f('c', 'float64', { isRecord: true })]);

// Record with model values
addM('RecCoord', [f('locations', 'Coord', { isRecord: true, isModel: true })]);
addM('RecInner', [f('nodes', 'Inner', { isRecord: true, isModel: true })]);
addM('RecIdVal', [f('entries', 'IdVal', { isRecord: true, isModel: true })]);
addM('RecMoney', [f('prices', 'Money', { isRecord: true, isModel: true })]);

// Mixed Record and other fields
addM('RecMix1', [f('id', 'string'), f('metadata', 'string', { isRecord: true })]);
addM('RecMix2', [f('count', 'int32'), f('labels', 'string', { isRecord: true }), f('scores', 'int32', { isRecord: true })]);
addM('RecMix3', [f('name', 'string'), f('coords', 'Coord', { isRecord: true, isModel: true }), f('tags', 'string', { isRecord: true })]);
addM('RecMix4', [f('active', 'boolean'), f('config', 'string', { isRecord: true }), f('inner', 'Inner', { isModel: true })]);

// Optional Record fields
addM('RecOpt1', [f('data', 'string', { isRecord: true, optional: true })]);
addM('RecOpt2', [f('id', 'int32'), f('metadata', 'string', { isRecord: true, optional: true })]);
addM('RecOpt3', [f('name', 'string'), f('coords', 'Coord', { isRecord: true, optional: true, isModel: true }), f('tags', 'string', { isRecord: true, optional: true })]);

// Record + Array combinations
addM('RecArr1', [f('items', 'string', { isArray: true }), f('lookup', 'int32', { isRecord: true })]);
addM('RecArr2', [f('matrix', 'float64', { isRecord: true }), f('vector', 'float64', { isArray: true })]);
addM('RecArr3', [f('mapping', 'Inner', { isRecord: true, isModel: true }), f('list', 'Inner', { isArray: true, isModel: true })]);

// Edge cases
addM('RecEmpty', [f('data', 'string', { isRecord: true })]);
addM('RecIntKey', [f('numbers', 'int32', { isRecord: true })]);
addM('RecFloatKey', [f('decimals', 'float64', { isRecord: true })]);
addM('RecBytesKey', [f('binaries', 'bytes', { isRecord: true })]);

// Deep nested with Record
addM('RecNest1', [f('outer', 'RecString', { isModel: true })]);
addM('RecNest2', [f('parent', 'RecCoord', { isModel: true }), f('child', 'RecInner', { isModel: true })]);

// ═══════════════════════════════════════════
// Special models
// ═══════════════════════════════════════════

addM('TimestampEntry', [f('ts', 'int64'), f('event', 'string'), f('payload', 'bytes', { optional: true })]);
addM('ConfigEntry', [f('key', 'string'), f('intValue', 'int32', { optional: true }), f('strValue', 'string', { optional: true }), f('boolValue', 'boolean', { optional: true }), f('floatValue', 'float64', { optional: true })]);

// ═══════════════════════════════════════════
// Test models list (exclude sub-models)
// ═══════════════════════════════════════════

export const testModels = modelOrder.filter(n => !SUB_MODELS.includes(n));

console.log(`Total models: ${modelOrder.length}`);
console.log(`Test models: ${testModels.length}`);