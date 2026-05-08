import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VEC = path.join(__dirname, "vectors");
fs.mkdirSync(path.join(VEC, "scalars"), { recursive: true });

import "./gen/definitions.mjs";
import { emitTSP } from "./gen/tsp.mjs";
import { emitSchema } from "./gen/schema.mjs";

emitTSP();
emitSchema();

await import("./gen/vectors.mjs");
