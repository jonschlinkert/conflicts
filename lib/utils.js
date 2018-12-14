'use strict';

const fs = require('fs');
const path = require('path');
const define = (name, fn) => Reflect.defineProperty(exports, name, { get: fn });
const imageExts = ['bmp', 'dds', 'gif', 'jpeg', 'png', 'psd', 'svg', 'tiff', 'webp'];

/**
 * Module dependencies
 */

define('diff', () => require('diff'));
define('colors', () => require('ansi-colors'));
define('dateformat', () => require('dateformat'));
define('fileType', () => require('file-type'));
define('image_size', () => require('image-size'));
define('Table', () => require('cli-table'));

/**
 * Symbols
 */

const symbols = exports.colors.symbols;
exports.info = exports.colors.cyan(symbols.info);
exports.error = exports.colors.red(symbols.error);
exports.success = exports.colors.green(symbols.success);
exports.warning = exports.colors.yellow(symbols.warning);

/**
 * Get the number of newlines in a string.
 */

exports.lineCount = str => {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }
  return str.trim().split('\n').length - 1;
};

exports.shorten = fp => {
  return fp.slice(0, 5) + (fp.length >= 24 ? '...' + fp.slice(-21) : fp);
};

/**
 * Logs out the relative path for the given `file`
 */

exports.relative = (file, style = exports.colors.cyan) => {
  if (file.relative) {
    return style(file.relative);
  }
  if (file.path && file.cwd) {
    return style(path.relative(file.cwd, file.path));
  }
  if (file.path) {
    return style(path.basename(file.path));
  }
  return style('file');
};

exports.toFile = (value, options = {}) => {
  let File = options.File || require('./file');
  let cwd = options.cwd || process.cwd();
  let file = value;
  let contents;

  if (typeof value === 'string') {
    file = new File({ path: path.resolve(cwd, value), cwd });
  } else if (typeof value === 'object') {
    if (!File.isVinyl()) {
      file = new File(value);
      file.cwd = cwd;
    }
  } else {
    throw new TypeError('expected file to be a string or object');
  }

  if (options.fs !== false && file.isNull() && exports.exists(file)) {
    Reflect.defineProperty(file, 'contents', {
      configurable: true,
      set(value) {
        contents = value;
      },
      get() {
        return contents || (contents = fs.readFileSync(file.path));
      }
    });
  }
  return file;
};

exports.ensureContents = file => {
  if (!file.contents) {
    file.contents = exports.exists(file) ? fs.readFileSync(file.path) : Buffer.from('');
  }
  return file.contents;
};

/**
 * Returns true if the given file.path exists.
 */

exports.exists = file => {
  if (typeof file._exists === 'boolean') {
    return file._exists;
  }
  file._exists = file.path && fs.existsSync(file.path);
  return file._exists;
};

exports.isDirectory = file => {
  if (typeof file._isDirectory === 'boolean') {
    return file._isDirectory;
  }
  if (!exports.exists(file)) {
    file._isDirectory = false;
    return false;
  }
  file._isDirectory = fs.statSync(file.path).isDirectory();
  return file._isDirectory;
};

exports.openSync = (...args) => {
  let cb = args.pop();
  let fd = fs.openSync(...args);
  try {
    return cb(fd);
  } finally {
    fs.closeSync(fd);
  }
};

/**
 * Read a chunk from the given filepath.
 */

exports.readChunk = (fp, pos, len) => {
  let buf = Buffer.alloc(len);
  let read = desc => fs.readSync(desc, buf, 0, len, pos);
  let bytesRead = exports.openSync(fp, 'r', read);
  if (bytesRead < len) {
    return buf.slice(0, bytesRead);
  }
  return buf;
};

/**
 * Returns true if given file is an image.
 */

exports.isImage = type => imageExts.includes(type.ext);

/**
 * Returns true if `val` is an object.
 */

exports.isObject = val => {
  return val && typeof val === 'object' && !Array.isArray(val);
};

/**
 * Returns true if `val` is a string.
 */

exports.isString = val => typeof val === 'string';

/**
 * Returns true if `val` is a buffer.
 */

exports.isBuffer = val => {
  if (val && val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
};

/**
 * Return a formatted image size (e.g. "1280 x 720")
 */

exports.imageSize = filepath => {
  if (!fs.existsSync(filepath)) return null;
  let type = exports.fileType(exports.readChunk(filepath, 0, 4100));
  if (type && exports.isImage(type)) {
    let size = exports.image_size(filepath);
    if (size) {
      return size.width + ' x ' + size.height;
    }
  }
  return '-';
};

/**
 * Format byte size
 */

exports.bytes = (number, precision = 2) => {
  let abbr = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  let len = abbr.length;

  precision = Math.pow(10, precision);
  number = Number(number);

  while (len-- >= 0) {
    let size = Math.pow(10, len * 3);
    if (size <= number) {
      number = Math.round(number * precision / size) / precision;
      number += ' ' + abbr[len];
      break;
    }
  }
  return number;
};

exports.merge = (...args) => {
  let target = {};
  for (let ele of args) exports.mixin(target, ele);
  return target;
};

exports.mixin = (target, b) => {
  if (!exports.isObject(target)) return b;
  if (!exports.isObject(b)) return target;
  for (let key of Object.keys(b)) {
    let desc = Object.getOwnPropertyDescriptor(b, key);
    if (desc.hasOwnProperty('value')) {
      if (target.hasOwnProperty(key) && exports.isObject(desc.value)) {
        let existing = Object.getOwnPropertyDescriptor(target, key);
        if (exports.isObject(existing.value)) {
          target[key] = exports.merge({}, target[key], b[key]);
        } else {
          Reflect.defineProperty(target, key, desc);
        }
      } else {
        Reflect.defineProperty(target, key, desc);
      }
    } else {
      Reflect.defineProperty(target, key, desc);
    }
  }
  return target;
};
