'use strict';

const diffFile = require('./diff');
const { success, warning, error, info, relative } = require('./utils');
const noop = () => {};

/**
 * Log out possible actions when a conflict is found
 */

class Actions {
  constructor(conflicts, options = {}) {
    this.conflicts = conflicts;
    this.log = options.show !== false ? console.error : noop;
  }
  yes(existing, proposed, options) {
    this.log('%s Overwriting %s', success, relative(proposed));
    this.conflicts.state.yes = true;
    this.conflicts.push(proposed);
  }
  no(existing, proposed, options) {
    this.log('%s Skipping %s', warning, relative(proposed));
    this.conflicts.state.no = true;
  }
  all(existing, proposed, options) {
    this.log('%s All remaining files will be written, overwriting any existing files.', success);
    this.conflicts.state.all = true;
    this.conflicts.push(proposed);
  }
  abort(existing, proposed, options) {
    this.log('%s Stopping, no files will be overwritten.', error);
    this.conflicts.state.files = [];
    this.conflicts.state.abort = true;
  }
  diff(existing, proposed, options) {
    this.log('%s Diff comparison of %s and existing content.', info, relative(proposed));
    this.log(diffFile(existing, proposed, options));
    return this.conflicts.detect(existing, proposed, options);
  }
  skip(existing, proposed, options) {
    this.log('%s Skipping %s', warning, relative(proposed), 'File is identical.');
    this.conflicts.state.skip = true;
  }
}

module.exports = Actions;