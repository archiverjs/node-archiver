/**
 * Type definitions for archiver 8.x
 *
 * archiver v8 exports the base `Archiver` class plus format-specific subclasses
 * (`ZipArchive`, `TarArchive`, `JsonArchive`). Each subclass instance is a
 * Node `stream.Transform`, so the standard Readable/Writable APIs are available.
 */

import { Stats } from "node:fs";
import {
  Readable,
  Transform,
  TransformOptions as NodeTransformOptions,
} from "node:stream";
import { ZlibOptions } from "node:zlib";

export interface CoreOptions {
  /** Number of workers used to process the internal fs stat queue. @default 4 */
  statConcurrency?: number;
}

export type TransformOptions = NodeTransformOptions;

export interface ZipOptions {
  /** Sets the zip archive comment. */
  comment?: string;
  /** Forces the archive to contain local file times instead of UTC. */
  forceLocalTime?: boolean;
  /** Forces the archive to contain ZIP64 headers. */
  forceZip64?: boolean;
  /** Prepends a forward slash to archive file paths. @default false */
  namePrependSlash?: boolean;
  /** Sets the compression method to STORE. @default false */
  store?: boolean;
  /** Options passed through to zlib. */
  zlib?: ZlibOptions;
}

export interface TarOptions {
  /** Compress the tar archive with gzip. @default false */
  gzip?: boolean;
  /** Options passed through to zlib when gzip is enabled. */
  gzipOptions?: ZlibOptions;
}

export type ArchiverOptions = CoreOptions &
  TransformOptions &
  ZipOptions &
  TarOptions;

export interface EntryData {
  /** Entry name including internal path. */
  name: string;
  /** Entry modification date. */
  date?: Date | string;
  /** Entry permissions (octal as decimal). */
  mode?: number;
  /** Path prefix prepended to `name`. Useful with `directory` / `glob`. */
  prefix?: string;
  /** Pre-computed fs.Stats — avoids a redundant stat call. */
  stats?: Stats;
}

export interface ZipEntryData extends EntryData {
  /** Sets the compression method for this entry to STORE. */
  store?: boolean;
}

export type TarEntryData = EntryData;

/** Return `false` to skip an entry, or an `EntryData` to mutate it. */
export type EntryDataFunction = (entry: EntryData) => false | EntryData;

export interface ProgressData {
  entries: {
    total: number;
    processed: number;
  };
  fs: {
    totalBytes: number;
    processedBytes: number;
  };
}

export interface GlobOptions {
  cwd?: string;
  /** Other readdir-glob options pass through. */
  [key: string]: unknown;
}

/**
 * Shape of errors emitted on the `error` and `warning` events. Not a runtime
 * export — typed structurally so consumers can annotate listeners without
 * importing a class that the package does not expose.
 */
export interface ArchiverError extends Error {
  code: string;
  data: unknown;
  path?: string;
}

export class Archiver extends Transform {
  constructor(options?: ArchiverOptions);

  /**
   * Aborts the archiving process. Pending queue tasks are dropped, active
   * workers are allowed to finish, and the stream is ended.
   */
  abort(): this;

  /** Appends an input source (string, Buffer, or Readable) to the archive. */
  append(
    source: Readable | Buffer | string,
    data?: EntryData | ZipEntryData | TarEntryData,
  ): this;

  /**
   * Appends a directory recursively. Pass `false` as `destpath` to flatten the
   * directory contents to the archive root.
   */
  directory(
    dirpath: string,
    destpath: false | string,
    data?: Partial<EntryData> | EntryDataFunction,
  ): this;

  /** Appends a single file by path, using lazystream to defer the fd open. */
  file(filepath: string, data: EntryData): this;

  /** Appends every file matching a readdir-glob pattern. */
  glob(pattern: string, options?: GlobOptions, data?: Partial<EntryData>): this;

  /** Finalizes the archive. Resolves once the underlying module emits `end`. */
  finalize(): Promise<void>;

  /**
   * Programmatically adds a symlink entry. Does not touch the filesystem.
   * `mode` defaults to the format-specific default if omitted.
   */
  symlink(filepath: string, target: string, mode?: number): this;

  /** Current number of bytes emitted by the stream. */
  pointer(): number;

  // Typed event listeners. Falls through to the base `Transform` overloads
  // for everything else.
  on(
    event: "error" | "warning",
    listener: (error: ArchiverError) => void,
  ): this;
  on(event: "data", listener: (data: Buffer) => void): this;
  on(event: "progress", listener: (progress: ProgressData) => void): this;
  on(event: "entry", listener: (entry: EntryData) => void): this;
  on(event: "close" | "drain" | "finish" | "end", listener: () => void): this;
  on(event: "pipe" | "unpipe", listener: (src: Readable) => void): this;
  on(event: string | symbol, listener: (...args: unknown[]) => void): this;
}

export class ZipArchive extends Archiver {
  constructor(options?: CoreOptions & NodeTransformOptions & ZipOptions);
}

export class TarArchive extends Archiver {
  constructor(options?: CoreOptions & NodeTransformOptions & TarOptions);
}

export class JsonArchive extends Archiver {
  constructor(options?: CoreOptions & NodeTransformOptions);
}
