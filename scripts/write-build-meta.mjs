import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const targetDir = path.join(process.cwd(), "src", "lib");
const targetFile = path.join(targetDir, "build-meta.ts");
const buildTime = new Date().toISOString();

await mkdir(targetDir, { recursive: true });
await writeFile(targetFile, `export const buildTime = ${JSON.stringify(buildTime)};\n`, "utf8");