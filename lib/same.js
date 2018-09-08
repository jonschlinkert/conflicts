'use strict';

const utils = require('./utils');

module.exports = (existing, proposed, options = {}) => {
  let fileA = utils.toFile(existing, options);
  let fileB = utils.toFile(proposed, options);

  if (fileA.isDirectory() || fileB.isDirectory()) {
    return false;
  }

  if (fileA.isNull() && !utils.exists(fileA)) {
    return false;
  }

  if (fileB.isNull() && !utils.exists(fileB)) {
    return false;
  }

  // file.contents lengths don't match, there is a conflict
  if (fileA.contents.length !== fileB.contents.length) {
    return false;
  }

  return fileA.contents.toString('hex') === fileB.contents.toString('hex');
};
