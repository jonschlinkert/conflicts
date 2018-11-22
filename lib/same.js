'use strict';

const utils = require('./utils');

module.exports = (existing, proposed, options = {}) => {
  let fileA = utils.toFile(existing, options);
  let fileB = utils.toFile(proposed, options);

  if (fileA.isDirectory() || fileB.isDirectory()) {
    return false;
  }

  if (fileA.size !== fileB.size) {
    return false;
  }

  for (let i = 0; i < fileA.contents.length; i++) {
    if (fileA.contents[i] !== fileB.contents[i]) {
      return false;
    }
  }
  return true;
};
