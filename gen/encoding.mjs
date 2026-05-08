import { models, enums, unions } from "./definitions.mjs";

export function unionVariantName(data) {
  const keys = Object.keys(data);
  if (keys.length !== 1) throw new Error("union data must have exactly one key, got: " + JSON.stringify(keys));
  return keys[0];
}

export function encodeUnion(data, w, unionName) {
  const u = unions[unionName];
  const vname = unionVariantName(data);
  const variant = u.variants.find(vr => vr.name === vname);
  if (!variant) throw new Error(`unknown variant ${vname} for union ${unionName}`);
  w.beginObject(1);
  w.writeField(vname);
  const val = data[vname];
  if (variant.isScalar) {
    switch (variant.type) {
      case "string": w.writeString(val); break;
      case "boolean": w.writeBool(val); break;
      case "int8": case "int16": case "int32": w.writeInt32(val); break;
      case "int64": w.writeInt64(BigInt(val)); break;
      case "uint8": case "uint16": case "uint32": w.writeUint32(val); break;
      case "uint64": w.writeUint64(BigInt(val)); break;
      case "float32": w.writeFloat32(val); break;
      case "float64": w.writeFloat64(val); break;
      default: throw new Error("Unknown scalar type: " + variant.type);
    }
  } else if (models[variant.type]) {
    writeModelFields(val, w, variant.type);
  } else if (unions[variant.type]) {
    encodeUnion(val, w, variant.type);
  } else {
    throw new Error("Unknown variant type: " + variant.type);
  }
  w.endObject();
}

export function writeModelFields(o, w, modelName) {
  const m = models[modelName];
  const present = m.fields.filter(f => !(f.optional && (o[f.name] === null || o[f.name] === undefined)));
  w.beginObject(present.length);
  for (const f of m.fields) {
    if (f.optional && (o[f.name] === null || o[f.name] === undefined)) continue;
    w.writeField(f.name);
    writeValueByType(o[f.name], w, f);
  }
  w.endObject();
}

export function writeValueByType(val, w, field) {
  if (field.optional && (val === null || val === undefined)) { w.writeNull(); return; }
  if (field.isArray) {
    w.beginArray(val.length);
    for (const item of val) { w.nextElement(); writeValueByType(item, w, { ...field, isArray: false }); }
    w.endArray();
    return;
  }
  if (field.isModel) { writeModelFields(val, w, field.type); return; }
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
    default:
      if (enums[field.type]) { w.writeString(val); break; }
      if (unions[field.type]) { encodeUnion(val, w, field.type); break; }
      throw new Error("Unknown type: " + field.type);
  }
}

import { JsonWriter, GronWriter, MsgPackWriter } from "@specodec/specodec-ts";

export function specodecJson(data, modelName) {
  const w = new JsonWriter();
  writeModelFields(data, w, modelName);
  return new TextDecoder().decode(w.toBytes());
}

export function specodecGron(data, modelName) {
  const w = new GronWriter();
  writeModelFields(data, w, modelName);
  return new TextDecoder().decode(w.toBytes());
}

export function specodecMsgPack(data, modelName) {
  const w = new MsgPackWriter();
  writeModelFields(data, w, modelName);
  return w.toBytes();
}

export function specodecUnionJson(data, unionName) {
  const w = new JsonWriter();
  encodeUnion(data, w, unionName);
  return new TextDecoder().decode(w.toBytes());
}

export function specodecUnionGron(data, unionName) {
  const w = new GronWriter();
  encodeUnion(data, w, unionName);
  return new TextDecoder().decode(w.toBytes());
}

export function specodecUnionMsgPack(data, unionName) {
  const w = new MsgPackWriter();
  encodeUnion(data, w, unionName);
  return w.toBytes();
}

export function randomFormatJson(data) {
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
