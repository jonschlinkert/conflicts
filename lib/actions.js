'use strict';

const diffFile = require('./diff');
const { success, warning, error, info, relative } = require('./utils');
const noop = () => {};

/**
 * Log out possible actions when a conflict is found
 */

class Actions {
  constructor(conflicts, options = {}, styles) {
    /* eslint-disable no-console */
    this.conflicts = conflicts;
    this.styles = styles;
    let silent = options.show === false || options.silent === true;
    this.log = silent !== true ? console.error : noop;
    this.rel = file => relative(file, this.styles.info);
  }
  yes(proposed, existing, options) {
    this.log('%s Overwriting %s', success, this.rel(existing));
    this.conflicts.state.yes = true;
    this.conflicts.push(proposed);
  }
  no(proposed, existing, options) {
    this.log('%s Skipping %s', warning, this.rel(existing));
    this.conflicts.state.no = true;
  }
  all(proposed, existing, options) {
    this.log('%s All remaining files will be written, overwriting any existing files.', success);
    this.conflicts.state.all = true;
    this.conflicts.push(proposed);
  }
  abort(proposed, existing, options) {
    this.log('%s Stopping, no files will be overwritten.', error);
    this.conflicts.state.files = [];
    this.conflicts.state.abort = true;
  }
  diff(proposed, existing, options) {
    this.log('%s Diff comparison of %s and existing content.', info, this.rel(existing));
    this.log(diffFile(proposed, existing, options));
    return this.conflicts.detect(proposed, existing, options);
  }
  skip(proposed, existing, options) {
    this.log('%s Skipping %s,', info, this.rel(existing), 'file is identical.');
    this.conflicts.state.skip = true;
  }
}

module.exports = Actions;
