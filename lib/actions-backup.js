'use strict';

const { success, warning, error, info, relative } = require('./utils');
const log = console.error;

/**
 * Log out possible actions when a conflict is found
 */

module.exports = {
  yes(file) {
    log('%s Overwriting %s', success, relative(file));
  },
  no(file) {
    log('%s Skipping %s', warning, relative(file));
  },
  all(file) {
    log('%s All remaining files will be written, overwriting any existing files.', success);
  },
  abort(file) {
    log('%s Stopping, no files will be overwritten.', error);
  },
  diff(file) {
    log('%s Diff comparison of %s and existing content.', info, relative(file));
  },
  skip(file) {
    log('%s Skipping %s', warning, relative(file), 'File is identical.');
  }
};
