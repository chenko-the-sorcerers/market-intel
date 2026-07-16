import { mkdir, rm, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "public");
const files = ["index.html", "styles.css", "app.js"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  await copyFile(resolve(root, file), resolve(output, file));
}

console.log(`Static build complete: copied ${files.length} files to public/`);
