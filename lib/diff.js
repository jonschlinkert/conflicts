'use strict';

const fs = require('fs');
const isBuffer = require('is-binary-buffer');
const utils = require('./utils');

/**
 * Returns a formatted diff for binary or text files
 */

function diffFile(existing, proposed) {
  let { ensureContents, exists, readChunk } = utils;

  let contentsA = existing.contents;
  let contentsB = proposed.contents;

  if (!contentsA && exists(existing)) {
    contentsA = readChunk(existing.path, 0, 4 + 4096);
  }

  if (!contentsB && exists(proposed)) {
    contentsB = readChunk(proposed.path, 0, 4 + 4096);
  }

  if ((contentsA && isBuffer(contentsA)) || (contentsB && isBuffer(contentsB))) {
    return diffBinary(existing, proposed);
  }

  ensureContents(existing);
  ensureContents(proposed);
  return diffText(existing.contents.toString(), proposed.contents.toString());
}

/**
 * Shows a colored diff of two strings.
 * @param {String} `existing` File path of the existing (old) file
 * @param {Buffer} `contents` Buffered contents of the proposed (new) file.
 */

function diffText(existingStr, proposedStr) {
  let { colors, diff, isObject, lineCount } = utils;

  if (isObject(existingStr)) existingStr = existingStr.contents;
  if (isObject(proposedStr)) proposedStr = proposedStr.contents;

  let strA = existingStr.toString();
  let strB = proposedStr.toString();

  if (!lineCount(strA) && !lineCount(strB)) {
    return diffChars(strA, strB);
  }

  let tokens = diff.diffLines(strA, strB);
  let msg = `\n${colors.green('+ added')}\n${colors.red('- removed')}\n\n`;

  for (let token of tokens) {
    if (token.added) {
      msg += colors.green('+' + token.value.slice(1)) + '\n';
      continue;
    }
    if (token.removed) {
      msg += colors.red('-' + token.value.slice(1)) + '\n';
      continue;
    }
    msg += token.value + '\n';
  }
  return msg;
}

function diffChars(existingStr, proposedStr) {
  let { colors, diff, isObject } = utils;

  if (isObject(existingStr)) existingStr = existingStr.contents;
  if (isObject(proposedStr)) proposedStr = proposedStr.contents;

  let strA = existingStr.toString();
  let strB = proposedStr.toString();

  let tokens = diff.diffChars(strA, strB);
  let msg = `\n${colors.green('+ added')}\n${colors.red('- removed')}\n\n`;

  for (let token of tokens) {
    if (token.added) {
      msg += colors.green(token.value);
      continue;
    }
    if (token.removed) {
      msg += colors.red(token.value);
      continue;
    }
    msg += token.value;
  }
  return msg;
}

/**
 * Shows table of the differences in stats between two binary files.
 * @param {String} `filepath` File path of the existing (old) file.
 * @param {Buffer} `contents` Buffered contents of the proposed (new) file.
 */

function diffImage(existing, proposed) {
  let { bytes, dateformat, imageSize, Table } = utils;
  let table = new Table({ head: ['', 'Existing', 'Replacement', 'Diff'] });
  let dimensionsA = imageSize(existing.path);
  let dimensionsB = imageSize(proposed.path);
  let length = proposed.contents.length;
  let stat = existing.stat || (existing.stat = fs.statSync(existing.path));
  let shorten = fp => fp.slice(0, 5) + (fp.length >= 24 ? '...' + fp.slice(-21) : fp);

  let sizeDiff = stat.size > proposed.contents.length ? '-' : '+';
  sizeDiff += bytes(Math.abs(stat.size - length));

  table.push(['Path', shorten(existing.path), shorten(proposed.path), '']);
  table.push(['Size', bytes(stat.size), bytes(length), sizeDiff]);
  table.push(['Dimensions', dimensionsA, dimensionsB, 'N/A']);
  table.push(['Date modified', dateformat(stat.mtime), 'New', 'N/A']);
  table.push(['Date accessed', dateformat(stat.atime), 'New', 'N/A']);
  table.push(['Date created', dateformat(stat.birthtime), 'New', 'N/A']);
  return table.toString();
}

function diffBinary(existing, proposed) {
  let { bytes, dateformat, Table } = utils;
  let table = new Table({ head: ['', 'Existing', 'Replacement', 'Diff'] });
  let length = proposed.contents.length;
  let stat = existing.stat || (existing.stat = fs.statSync(existing.path));
  let shorten = fp => fp.slice(0, 5) + (fp.length >= 24 ? '...' + fp.slice(-21) : fp);

  let sizeDiff = stat.size > proposed.contents.length ? '-' : '+';
  sizeDiff += bytes(Math.abs(stat.size - length));

  table.push(['Path', shorten(existing.path), shorten(proposed.path), '']);
  table.push(['Size', bytes(stat.size), bytes(length), sizeDiff]);
  table.push(['Date modified', dateformat(stat.mtime), 'New', 'N/A']);
  table.push(['Date accessed', dateformat(stat.atime), 'New', 'N/A']);
  table.push(['Date created', dateformat(stat.birthtime), 'New', 'N/A']);
  return table.toString();
}

/**
 * Expose `diffFile`
 */

diffFile.text = diffText;
diffFile.chars = diffChars;
diffFile.image = diffImage;
diffFile.binary = diffBinary;
module.exports = diffFile;
