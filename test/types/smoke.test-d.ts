/**
 * Type-only smoke test. Run via `npm run typecheck`.
 * Nothing here executes — every statement is checked by `tsc --noEmit`.
 */

import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import type {
  Archiver,
  ArchiverError,
  ArchiverOptions,
  EntryData,
  EntryDataFunction,
  ProgressData,
} from "../../index.js";
import { JsonArchive, TarArchive, ZipArchive } from "../../index.js";

const zipOpts: ArchiverOptions = {
  statConcurrency: 2,
  highWaterMark: 1024,
  zlib: { level: 9 },
  store: false,
};
const zip: ZipArchive = new ZipArchive(zipOpts);
zip.pipe(createWriteStream("out.zip"));

zip.append(Buffer.from("hi"), { name: "hello.txt" });
zip.append("hi", { name: "hello.txt", mode: 0o644 });
zip.append(Readable.from(["chunk"]), { name: "stream.txt", store: true });

zip.file("README.md", { name: "README.md" });
zip.directory("src", "src");
zip.directory("src", false);

const transform: EntryDataFunction = (entry) => {
  if (entry.name.endsWith(".log")) return false;
  return entry;
};
zip.directory("logs", "logs", transform);

zip.glob("**/*.js", { cwd: "src", dot: true }, { prefix: "src" });

zip.symlink("link", "target");
zip.symlink("link", "target", 0o755);
zip.pointer();
zip.abort();

zip.on("error", (err: ArchiverError) => err.code);
zip.on("warning", (err: ArchiverError) => err.code);
zip.on("entry", (entry: EntryData) => entry.name);
zip.on("progress", (p: ProgressData) => p.entries.total + p.fs.processedBytes);
zip.on("data", (chunk: Buffer) => chunk.byteLength);
zip.on("close", () => undefined);
zip.on("finish", () => undefined);

const tar: TarArchive = new TarArchive({
  gzip: true,
  gzipOptions: { level: 6 },
});
tar.append("hi", { name: "hello.txt" });

const json: JsonArchive = new JsonArchive();
json.append(Buffer.from("hi"), { name: "hello.txt" });

const base: Archiver = zip;
const done: Promise<void> = base.finalize();
void done;

// ArchiverError is a structural type, not a runtime export.
const errShape: ArchiverError = Object.assign(new Error("boom"), {
  code: "ABORTED",
  data: { detail: 1 },
});
void errShape.code;
void errShape.data;
