import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { models, modelOrder, enums, enumOrder, unions, unionOrder } from "./definitions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPECS = __dirname.endsWith("/gen") ? path.dirname(__dirname) : __dirname;
const VEC = path.join(SPECS, "vectors");

export function emitSchema() {
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
  for (const name of enumOrder) {
    schema[name] = { kind: "enum", members: enums[name].members };
  }
  for (const name of unionOrder) {
    schema[name] = { kind: "union", variants: unions[name].variants.map(vr => ({ name: vr.name, type: vr.type, isScalar: vr.isScalar })) };
  }
  const schemaPath = path.join(VEC, "typeschema.json");
  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
  console.log(`Wrote ${schemaPath}`);
}
