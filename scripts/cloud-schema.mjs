import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const provider = 'provider = "sqlite"';
if (source.split(provider).length !== 2) throw new Error("Expected one SQLite datasource in prisma/schema.prisma.");
await writeFile(new URL("../prisma/cloud/schema.prisma", import.meta.url), source.replace(provider, 'provider = "postgresql"'));
