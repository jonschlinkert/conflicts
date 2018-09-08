'use strict';

const fs = require('fs');
const path = require('path');
const define = (name, fn) => Reflect.defineProperty(exports, name, { get: fn });
const exts = ['bmp', 'dds', 'gif', 'jpeg', 'png', 'psd', 'svg', 'tiff', 'webp'];

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

const symbols = process.platform === 'win32' ? {
  info: 'i',
  error: '×',
  success: '√',
  warning: '‼'
} : {
  info: 'ℹ',
  error: '✖',
  success: '✔',
  warning: '⚠'
};

define('info', () => exports.colors.cyan(symbols.info));
define('error', () => exports.colors.red(symbols.error));
define('success', () => exports.colors.green(symbols.success));
define('warning', () => exports.colors.yellow(symbols.warning));

/**
 * Get the number of newlines in a string.
 */

exports.lineCount = str => {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }
  return str.split('\n').length - 1;
};

/**
 * Logs out the relative path for the given `file`
 */

exports.relative = file => {
  if (file.relative) {
    return exports.colors.yellow(file.relative);
  }
  if (file.path && file.cwd) {
    return exports.colors.yellow(path.relative(file.cwd, file.path));
  }
  if (file.path) {
    return exports.colors.yellow(path.basename(file.path));
  }
  return exports.colors.yellow('file');
};

exports.toFile = (value, options = {}) => {
  let File = options.File || require('./file');
  let cwd = options.cwd || process.cwd();
  let file = value;

  if (typeof value === 'string') {
    file = new File({ path: value, cwd });
  } else if (typeof value === 'object' && !File.isVinyl(value)) {
    file = new File({ path: '.', cwd, ...value });
  } else if (!File.isVinyl(value)) {
    throw new TypeError('expected file to be a string or object');
  }

  if (options.fs !== false && (file.isNull() || !file.isBuffer()) && exports.exists(file)) {
    file.contents = fs.readFileSync(file.path);
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
  let bytesRead = exports.openSync(fp, 'r', desc => fs.readSync(desc, buf, 0, len, pos));
  if (bytesRead < len) {
    return buf.slice(0, bytesRead);
  }
  return buf;
};

/**
 * Returns true if given file is an image.
 */

exports.isImage = type => exts.includes(type.ext);

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
  let type = exports.fileType(exports.readchunk.sync(filepath, 0, 4100));

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

exports.bytes = (number, precision) => {
  if (typeof precision !== 'number') {
    precision = 2;
  }

  let abbr = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  precision = Math.pow(10, precision);
  number = Number(number);

  let len = abbr.length - 1;
  while (len-- >= 0) {
    let size = Math.pow(10, len * 3);
    if (size <= (number + 1)) {
      number = Math.round(number * precision / size) / precision;
      number += ' ' + abbr[len];
      break;
    }
  }
  return number;
};
