'use strict';

const fs = require('fs');
const log = require('log-utils');
const readchunk = require('read-chunk');
const fileType = require('file-type');
const imageSize = require('image-size');
const exts = ['bmp', 'dds', 'gif', 'jpeg', 'png', 'psd', 'svg', 'tiff', 'webp'];

/**
 * Get the number of newlines in a string.
 */

exports.lineCount = str => str.split('\n').length - 1;

/**
 * Logs out the relative path for the given `file`
 */

exports.relative = file => log.colors.yellow(file.relative);

/**
 * Returns true if given file is an image.
 */

exports.isImage = type => exts.indexOf(type.ext) !== -1;

/**
 * Return a formatted image size (e.g. "1280 x 720")
 */

exports.imageSize = function(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const type = fileType(readchunk.sync(filepath, 0, 4100));

  if (type && exports.isImage(type)) {
    const size = imageSize(filepath);
    if (size) {
      return size.width + ' x ' + size.height;
    }
  }
  return '-';
};

/**
 * Format byte size
 */

exports.bytes = function(number, precision) {
  if (typeof precision !== 'number') {
    precision = 2;
  }

  var abbr = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  precision = Math.pow(10, precision);
  number = Number(number);

  var len = abbr.length - 1;
  while (len-- >= 0) {
    var size = Math.pow(10, len * 3);
    if (size <= (number + 1)) {
      number = Math.round(number * precision / size) / precision;
      number += ' ' + abbr[len];
      break;
    }
  }
  return number;
};
