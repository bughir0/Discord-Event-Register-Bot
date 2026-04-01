import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "database", "migrations");
const dest = path.join(root, "dist", "database", "migrations");

fs.mkdirSync(dest, { recursive: true });
for (const name of fs.readdirSync(src)) {
  if (!name.endsWith(".sql")) continue;
  fs.copyFileSync(path.join(src, name), path.join(dest, name));
}
console.log("[copy-migrations] Arquivos .sql copiados para dist/database/migrations.");
