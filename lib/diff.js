'use strict';

const fs = require('fs');
const path = require('path');
const diff = require('diff');
const log = require('log-utils');
const dateformat = require('dateformat');
const isBuffer = require('is-binary-buffer');
const readChunk = require('read-chunk');
const Table = require('cli-table');
const utils = require('./utils');

/**
 * Returns a formatted diff for binary or text files
 */

function diffFile(existing, proposed) {
  if (isBuffer(readChunk.sync(existing.path, 0, 4 + 4096)) || isBuffer(proposed.contents)) {
    return diffBinary(existing, proposed);
  }

  if (!existing.contents) existing.contents = fs.readFileSync(existing);
  return diffText(existing.contents.toString(), proposed.contents.toString());
}

/**
 * Shows a colored diff of two strings.
 * @param {String} `existing` File path of the existing (old) file
 * @param {Buffer} `contents` Buffered contents of the proposed (new) file.
 */

function diffText(existingStr, proposedStr) {
  if (!utils.lineCount(existingStr) && !utils.lineCount(proposedStr)) {
    return diffChars(existingStr, proposedStr);
  }

  const tokens = diff.diffLines(existingStr, proposedStr);
  const colors = log.colors;

  let msg = `\n${colors.green('+ added')}\n${colors.red('- removed')}\n\n`;

  for (const token of tokens) {
    if (token.added) {
      msg += colors.green('+' + tok.value.slice(1)) + '\n';
      continue;
    }
    if (token.removed) {
      msg += colors.red('-' + tok.value.slice(1)) + '\n';
      continue;
    }
    msg += tok.value + '\n';
  }
  return msg;
}

function diffChars(existingStr, proposedStr) {
  const tokens = diff.diffChars(existingStr, proposedStr);
  const colors = log.colors;

  let msg = `\n${colors.green('+ added')}\n${colors.red('- removed')}\n\n`;

  for (const token of tokens) {
    if (token.added) {
      msg += colors.green(tok.value);
      continue;
    }
    if (token.removed) {
      msg += colors.red(tok.value);
      continue;
    }
    msg += tok.value;
  }
  return msg;
}

/**
 * Shows table of the differences in stats between two binary files.
 * @param {String} `filepath` File path of the existing (old) file.
 * @param {Buffer} `contents` Buffered contents of the proposed (new) file.
 */

function diffBinary(existing, proposed) {
  const table = new Table({ head: ['', 'Existing', 'Replacement', 'Diff'] });
  const dimensionsA = utils.imageSize(existing.path);
  const dimensionsB = utils.imageSize(proposed.path);
  const length = proposed.contents.length;
  const stat = existing.stat || (existing.stat = fs.statSync(existing.path));
  const shorten = fp => fp.slice(0, 5) + (fp.length >= 24 ? '...' + fp.slice(-21) : fp);

  let sizeDiff = stat.size > proposed.contents.length ? '-' : '+';
  sizeDiff += utils.bytes(Math.abs(stat.size - length));

  table.push([ 'Path', shorten(existing.path), shorten(proposed.path), '' ]);
  table.push([ 'Size', utils.bytes(stat.size), utils.bytes(length), sizeDiff ]);
  table.push([ 'Dimensions', dimensionsA, dimensionsB, 'N/A' ]);
  table.push([ 'Date modified', dateformat(stat.mtime), 'New', 'N/A' ]);
  table.push([ 'Date accessed', dateformat(stat.atime), 'New', 'N/A' ]);
  table.push([ 'Date created', dateformat(stat.birthtime), 'New', 'N/A' ]);
  return table.toString();
}

/**
 * Expose `diffFile`
 */

diffFile.text = diffText;
diffFile.binary = diffBinary;
module.exports = diffFile;
