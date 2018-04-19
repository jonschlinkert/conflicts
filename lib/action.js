'use strict';

const log = require('log-utils');
const { success, warning, error, info } = log;
const relative = file => log.colors.yellow(file.relative);
const dim = (...args) => log.colors.dim(...args);

/**
 * Log out possible actions when a conflict is found
 */

module.exports = {
  skip: function(file) {
    console.log('%s Skipping %s', warning, relative(file), 'File is identical.');
  },
  yes: function(file) {
    console.log('%s Overwriting %s', success, relative(file));
  },
  no: function(file) {
    console.log('%s Skipping %s', warning, relative(file));
  },
  all: function(file) {
    console.log('%s All remaining files will be written, overwriting any existing files.', success);
  },
  abort: function(file) {
    console.log('%s Stopping, no files will be written.', error);
  },
  diff: function(file) {
    console.log('%s Diff comparison of %s and existing content.', info, relative(file));
  }
};
