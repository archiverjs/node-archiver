import Archiver from "./lib/core.js";
import Zip from "./lib/plugins/zip.js";
import Tar from "./lib/plugins/tar.js";
import Json from "./lib/plugins/json.js";

export { Archiver };

export class ZipArchive extends Archiver {
  constructor(options) {
    super(options);
    this._format = "zip";
    this._module = new Zip(options);
    this._supportsDirectory = true;
    this._supportsSymlink = true;
    this._modulePipe();
  }
}

export class TarArchive extends Archiver {
  constructor(options) {
    super(options);
    this._format = "tar";
    this._module = new Tar(options);
    this._supportsDirectory = true;
    this._supportsSymlink = true;
    this._modulePipe();
  }
}

export class JsonArchive extends Archiver {
  constructor(options) {
    super(options);
    this._format = "json";
    this._module = new Json(options);
    this._supportsDirectory = true;
    this._supportsSymlink = true;
    this._modulePipe();
  }
}
