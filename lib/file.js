'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');
const utils = require('./utils');

/**
 * Mock vinyl File.
 *
 * ```js
 * new File({ path: 'path/to/file.hbs' });
 * new File({ path: 'path/to/file.hbs', contents: Buffer.from('...') });
 * new File('path/to/file.hbs', { contents: Buffer.from('...') });
 * ```
 * @name File
 * @param {Object} `file`
 * @api public
 */

class File {
  constructor(file = {}) {
    assert(utils.isObject(file), 'expected file to be an object');
    this.history = file.history ? file.history.slice() : [];
    this.root = '/';
    Object.assign(this, file);
  }

  [util.inspect.custom]() {
    const inspect = this.base && this.path ? [`"${this.relative}"`] : [];
    if (this.isBuffer()) inspect.push(this.contents.inspect());
    return `<File ${inspect.join(' ')}>`;
  }

  isNull() {
    return this.contents == null;
  }

  isBuffer() {
    return this.contents && utils.isBuffer(this.contents);
  }

  isDirectory() {
    if (this.isNull() && this.stat && typeof this.stat.isDirectory === 'function') {
      return this.stat.isDirectory();
    }
    return false;
  }

  isAbsolute() {
    return path.isAbsolute(this.path);
  }

  isInsidePath(val) {
    return path.isAbsolute(this.path);
  }

  /**
   * Get or set `file.contents`.
   */

  set contents(val = '') {
    this._contents = typeof val === 'string' ? Buffer.from(val) : val;
  }
  get contents() {
    return this._contents;
  }

  /**
   * Get or set the current working directory. This is used for resolving
   * the absolute path for the file.
   */

  set cwd(val) {
    this._cwd = path.resolve(path.normalize(val));
  }
  get cwd() {
    return this._cwd || process.cwd();
  }

  /**
   * Get or set the base path. This is used for generating the `file.relative` path.
   */

  set base(val) {
    this._base = val;
  }
  get base() {
    return path.resolve(this._base || this.cwd);
  }

  /**
   * Get or set the `file.path`.
   */

  set path(val) {
    assert.equal(typeof val, 'string', 'expected file.path to be a string');
    val = path.resolve(path.normalize(val));
    if (val !== '' && val !== this.path) {
      this.history.push(val);
    }
  }
  get path() {
    return this.history[this.history.length - 1];
  }

  /**
   * Get the absolute `file.path`. This is automatically created and cannot
   * be directly set.
   */

  get absolute() {
    return path.resolve(this.path);
  }

  /**
   * Get the relative path from `file.base`. This is automatically created
   * and cannot be directly set.
   */

  get relative() {
    return path.relative(this.base, this.path);
  }

  /**
   * Get or set the dirname of the `file.path`.
   */

  set dirname(val) {
    this.path = path.resolve(val, this.basename);
  }
  get dirname() {
    return path.dirname(this.path);
  }

  /**
   * Get or set the basename of the `file.path`.
   */

  set basename(val) {
    this.path = path.join(this.dirname, val);
  }
  get basename() {
    return path.basename(this.path);
  }

  /**
   * Get or set the `stem` of the `file.path`.
   * @name stem
   * @param {String} `stem`
   * @return {String}
   * @api public
   */

  set stem(val) {
    this.basename = val + this.extname;
  }
  get stem() {
    return path.basename(this.path, this.extname);
  }

  /**
   * Get or set the `extname` of the `file.path`.
   * @name extname
   * @param {String} `extname`
   * @return {String}
   * @api public
   */

  set extname(val) {
    this.basename = this.stem + val;
  }
  get extname() {
    return path.extname(this.path);
  }

  set stat(val) {
    this._stat = val;
  }
  get stat() {
    return this._stat || (this._stat = this.path ? fs.statSync(this.path) : null);
  }

  get _isVinyl() {
    return true;
  }

  static isVinyl(file) {
    return utils.isObject(file) && file._isVinyl === true;
  }
}

/**
 * Expose `File`
 */

module.exports = File;
