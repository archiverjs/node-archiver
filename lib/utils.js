import normalizePath from "normalize-path";
import { PassThrough } from "readable-stream";
import { isStream } from "is-stream";

export function collectStream(source, callback) {
  var collection = [];
  var size = 0;

  source.on("error", callback);

  source.on("data", function (chunk) {
    collection.push(chunk);
    size += chunk.length;
  });

  source.on("end", function () {
    var buf = Buffer.alloc(size);
    var offset = 0;

    collection.forEach(function (data) {
      data.copy(buf, offset);
      offset += data.length;
    });

    callback(null, buf);
  });
}

export function dateify(dateish) {
  dateish = dateish || new Date();

  if (dateish instanceof Date) {
    dateish = dateish;
  } else if (typeof dateish === "string") {
    dateish = new Date(dateish);
  } else {
    dateish = new Date();
  }

  return dateish;
}

export function normalizeInputSource(source) {
  if (source === null) {
    return Buffer.alloc(0);
  } else if (typeof source === "string") {
    return Buffer.from(source);
  } else if (isStream(source)) {
    // Always pipe through a PassThrough stream to guarantee pausing the stream if it's already flowing,
    // since it will only be processed in a (distant) future iteration of the event loop, and will lose
    // data if already flowing now.
    return source.pipe(new PassThrough());
  }

  return source;
}

export function sanitizePath(filepath) {
  return normalizePath(filepath, false)
    .replace(/^\w+:/, "")
    .replace(/^(\.\.\/|\/)+/, "");
}

export function trailingSlashIt(str) {
  return str.slice(-1) !== "/" ? str + "/" : str;
}
