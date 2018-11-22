'use strict';

const isBuffer = require('is-binary-buffer');
const utils = require('./utils');

/**
 * Returns a formatted diff for binary or text files
 */

function diffFile(existing, proposed, options) {
  let { ensureContents, exists, readChunk } = utils;
  let opts = options || {};

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
  if (opts.diffText === true) {
    return diffText(existing.contents.toString(), proposed.contents.toString(), opts);
  }
  return diffChars(existing.contents.toString(), proposed.contents.toString(), opts);
}

/**
 * Create a unified diff patch. See [diff] for supported options
 * @param {String} `oldFile` [vinyl] file representing the existing file.
 * @param {Buffer} `newFile` [vinyl] file representing the proposed file.
 * @param {Object} `options`
 */

function filesPatch(oldFile, newFile, options) {
  let { diff, toFile } = utils;
  let opts = options || {};

  oldFile = toFile(oldFile, options);
  newFile = toFile(newFile, options);

  let nameA = oldFile.relative;
  let nameB = newFile.relative;

  let strA = oldFile.contents.toString();
  let strB = newFile.contents.toString();

  return diff.createTwoFilesPatch(nameA, nameB, strA, strB, opts.oldHeader, opts.newHeader, opts);
}

function diffText(existingStr, proposedStr, options = {}) {
  let { colors, diff, isObject, lineCount } = utils;

  if (isObject(existingStr)) existingStr = existingStr.contents;
  if (isObject(proposedStr)) proposedStr = proposedStr.contents;

  let strA = existingStr.toString();
  let strB = proposedStr.toString();

  if ((!lineCount(strA) && !lineCount(strB)) || options.diffChars === true) {
    return diffChars(strA, strB);
  }

  let tokens = diff.diffLines(strA, strB);
  let msg = `${colors.green('+ added')}\n${colors.red('- removed')}\n\n`;

  for (let token of tokens) {
    if (token.added) {
      msg += colors.green('+' + token.value);
      continue;
    }
    if (token.removed) {
      msg += colors.red('-' + token.value);
      continue;
    }
    msg += token.value;
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
  let msg = `${colors.green('+ added')}\n${colors.red('- removed')}\n\n`;

  for (let token of tokens) {
    msg += colors[token.added ? 'green' : token.removed ? 'red' : 'white'](token.value);
  }
  return msg;
}

/**
 * Shows table of the differences in stats between two binary files.
 * @param {String} `filepath` File path of the existing (old) file.
 * @param {Buffer} `contents` Buffered contents of the proposed (new) file.
 */

function diffImage(existing, proposed, options) {
  let { bytes, dateformat, imageSize, Table, toFile, colors } = utils;

  existing = toFile(existing, options);
  proposed = toFile(proposed, options);

  let table = new Table({ head: ['Attribute', 'Existing', 'Replacement', 'Diff'] });
  let dimensionsA = imageSize(existing.path);
  let dimensionsB = imageSize(proposed.path);
  let statA = existing.stat;
  let statB = proposed.stat;

  let isSmaller = existing.size > proposed.size;
  let sizeDiff = isSmaller ? '-' : '+';
  sizeDiff += bytes(Math.abs(existing.size - proposed.size));

  // dates
  let mtimeA = statA ? dateformat(statA.mtime) : 'New';
  let mtimeB = statB ? dateformat(statB.mtime) : 'New';
  if (statA.mtime && statB.mtime && statA.mtime < statB.mtime) {
    mtimeB = colors.green(mtimeB);
  } else {
    mtimeA = colors.green(mtimeA);
  }

  let birthtimeA = statA ? dateformat(statA.birthtime) : 'New';
  let birthtimeB = statB ? dateformat(statB.birthtime) : 'New';
  if (statA.birthtime && statB.birthtime && statA.birthtime < statB.birthtime) {
    birthtimeB = colors.green(birthtimeB);
  } else {
    birthtimeA = colors.green(birthtimeA);
  }

  // size
  let sizeA = bytes(existing.size);
  let sizeB = bytes(proposed.size);

  if (isSmaller) {
    sizeDiff = colors.red(sizeDiff);
    dimensionsA = colors.green(dimensionsA);
    sizeA = colors.green(sizeA);
  } else {
    sizeDiff = colors.green(sizeDiff);
    dimensionsB = colors.green(dimensionsB);
    sizeB = colors.green(sizeB);
  }

  table.push(['Path', existing.relative, proposed.relative, '']);
  table.push(['Size', sizeA, sizeB, sizeDiff]);
  table.push(['Dimensions', dimensionsA, dimensionsB, 'N/A']);
  table.push(['Date created', birthtimeA, birthtimeB, 'N/A']);
  table.push(['Date modified', mtimeA, mtimeB, 'N/A']);
  return table.toString();
}

function diffBinary(existing, proposed, options) {
  let { bytes, dateformat, Table, toFile } = utils;

  existing = toFile(existing, options);
  proposed = toFile(proposed, options);

  let table = new Table({ head: ['', 'Existing', 'Replacement', 'Diff'] });
  let length = proposed.contents.length;
  let stat = existing.stat;
  let sizeDiff = stat.size > proposed.contents.length ? '-' : '+';
  sizeDiff += bytes(Math.abs(stat.size - length));

  table.push(['Path', existing.relative, proposed.relative, '']);
  table.push(['Size', bytes(stat.size), bytes(length), sizeDiff]);
  table.push(['Date created', dateformat(stat.birthtime), 'New', 'N/A']);
  table.push(['Date modified', dateformat(stat.mtime), 'New', 'N/A']);
  return table.toString();
}

/**
 * Expose `diffFile`
 */

diffFile.filesPatch = filesPatch;
diffFile.file = diffFile;
diffFile.text = diffText;
diffFile.chars = diffChars;
diffFile.image = diffImage;
diffFile.binary = diffBinary;
module.exports = diffFile;
