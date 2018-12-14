'use strict';

const path = require('path');
const Events = require('events');
const diffFile = require('./lib/diff');
const Actions = require('./lib/actions');
const styles = require('./lib/styles');
const File = require('./lib/file');
const same = require('./lib/same');
const { exists, relative, toFile } = require('./lib/utils');

/**
 * Create an instance of `Conflicts` with the given `options`
 * and optional [Vinyl][vinyl] constructor.
 *
 * ```js
 * const Conflicts = require('conflicts');
 * const conflicts = new Conflicts({}, require('vinyl'));
 * ```
 * @name Conflicts
 * @param {Object} `options`
 * @param {Function} `File` Optionally pass a [vinyl][] contructor, otherwise the default `File` class is used.
 * @return {Conflicts} Returns an instance of Conflicts.
 * @api public
 */

class Conflicts extends Events {
  constructor(options, Vinyl = File) {
    super();

    if (typeof options === 'function' && options.name === 'Vinyl') {
      Vinyl = options;
      options = {};
    }

    this.options = { cwd: process.cwd(), ...options };
    this.styles = styles.merge(options);
    this.state = { files: [] };
    this.File = Vinyl;
  }

  /**
   * Compares an `existing` (old) file to a new `proposed` file, then
   * prompts for an action if the files are not equal. If the contents
   * of both files is identical, no action is taken, otherwise you will
   * be prompted to choose the action to take. See the unit tests for
   * examples of how to skip prompts.
   *
   * ```js
   * conflicts.detect(fileA, fileB)
   *   .then(action => console.log('Action taken:', action))
   *   .catch(console.error)
   * ```
   * @name .detectFile
   * @param {Object} `proposedFile` New file.
   * @param {Object} `existingFile` Existing file.
   * @param {Object} `options`
   * @return {Promise} Returns a promise with the action that was taken.
   * @api public
   */

  async detect(proposed, existing, options) {
    let opts = { File: this.file, ...this.options, ...options };
    let actions = new Actions(this, opts, this.styles);

    let fileA = toFile(existing, opts);
    let fileB = toFile(proposed, opts);

    // stop processing and exit
    if (this.state.abort === true) {
      this.state.files = [];
      return 'abort';
    }

    // overwrite the all files
    if (opts.overwrite === true || this.state.all === true) {
      this.push(fileB);
      return 'all';
    }

    // overwrite the existing file
    if (typeof opts.overwrite === 'function' && await opts.overwrite(fileB) === true) {
      this.push(fileB);
      return 'yes';
    }

    // overwrite the existing file
    if (!fileA.path || !exists(fileA)) {
      this.push(fileB);
      return 'yes';
    }

    // detect conflict
    if (!(await this.isEqual(fileB, fileA, opts))) {
      if (typeof opts.onConflict === 'function') {
        await opts.onConflict(fileB, fileA, opts);
      }

      let prompt = this.constructor.prompt(fileA, opts);
      let action = this.state.action = (fileB.action || await prompt.run());
      await actions[action](fileB, fileA, opts);
      return action;
    }

    await actions.skip(fileB, fileA, opts);
    return 'skip';
  }

  /**
   * Same as [.detect](#detect), except the second argument is
   * a string to an existing file on the file system.
   *
   * ```js
   * conflicts.detectFile(file, 'path/to/file.txt')
   *   .then(action => console.log('Action taken:', action))
   *   .catch(console.error)
   * ```
   * @name .detectFile
   * @param {Object} `proposed` New file.
   * @param {Object} `existingPath` File path to existing file.
   * @param {Object} `options`
   * @return {Promise} Returns a promise with the action that was taken.
   * @api public
   */

  async detectFile(proposed, existingPath, options = {}) {
    let opts = { ...this.options, ...options };
    let existing = new proposed.constructor({ path: existingPath, cwd: opts.cwd });
    return this.detect(proposed, existing, options);
  }

  /**
   * Runs [detect](#detect) on an array of "proposed" files.
   *
   * ```js
   * conflicts.files([fileA, fileB, fileC])
   *   .then(action => console.log('Action taken:', action))
   *   .catch(console.error)
   * ```
   * @name .files
   * @param {Array} `files` Array of file objects.
   * @param {Object} `options`
   * @return {Array<object>}
   * @api public
   */

  async files(files, options) {
    if (typeof options === 'string' || typeof options === 'function') {
      options = { dest: options };
    }

    let opts = { ...this.options, ...options };
    let dest = opts.dest;

    if (!dest) {
      throw new TypeError('expected destination path to be a string or function');
    }

    for (let file of [].concat(files || [])) {
      let proposed = toFile(file, opts);
      let destDir = typeof dest === 'function' ? dest(proposed) : dest;
      let existing = new this.File({ path: path.join(destDir, proposed.relative) });
      await this.detect(proposed, existing, opts);
    }

    return this.state.files;
  }

  /**
   * Takes an array of "proposed" files, and returns an array of strings,
   * where each string represents a [diff] of the proposed file's contents
   * versus an existing file's contents.
   *
   * ```js
   * conflicts.diffFiles([fileA, fileB, fileC])
   *   .then(diffs => {
   *     diffs.forEach(diff => console.log(diff));
   *   })
   *   .catch(console.error)
   * ```
   * @name .diffFiles
   * @param {Array} `files`
   * @param {Object} `options`
   * @return {Array<string>}
   * @api public
   */

  diffFiles(files, options = {}) {
    if (typeof options === 'string' || typeof options === 'function') {
      options = { dest: options };
    }

    files = [].concat(files || []);
    let opts = { ...this.options, ...options };
    let dest = opts.dest;
    let diffs = [];

    if (!dest && files.length === 2) {
      let fileA = toFile(files[0], opts);
      let fileB = toFile(files[1], opts);
      return [{ existing: fileA, proposed: fileB, diff: diffFile(fileA, fileB, opts) }];
    }

    if (!dest) {
      throw new TypeError('expected destination path to be a string or function');
    }

    for (let file of files) {
      let proposed = toFile(file, opts);
      let destDir = typeof dest === 'function' ? dest(proposed) : dest;
      let existing = new this.File({ path: path.join(destDir, proposed.relative) }, opts);
      let diff = diffFile(proposed, existing, opts);
      if (diff) {
        diffs.push({ proposed, existing, diff });
      }
    }
    return diffs;
  }

  /**
   * Returns true if an `fileA` (existing/old) file appears to
   * be identical to a `fileB` (proposed/new) file.
   *
   * ```js
   * console.log(conflicts.isEqual(fileA, fileB));
   * ```
   * @name .isEqual
   * @param {Object} `proposed` [vinyl][] file representing a proposed (new) file
   * @param {Object} `existing` [vinyl][] file representing an existing (old) file
   * @param {Object} `options`
   * @return {Boolean}
   * @api public
   */

  isEqual(proposed, existing, options) {
    return same(proposed, existing, { ...this.options, ...options });
  }

  /**
   * Push a file onto `conflicts.state.files`.
   * @param {Object} `file`
   * @return {undefined}
   */

  push(file) {
    if (!this.state.files.includes(file)) {
      this.state.files.push(file);
    }
  }

  /**
   * Static method for creating the prompt to run when a file
   * conflict is detected.
   * @name Conflicts#prompt
   * @param {Object} `file` [vinyl] file object for the proposed file.
   * @return {Object} Returns the prompt to run.
   */

  static prompt(file, options = {}) {
    let { Select } = require('enquirer');
    let question = {
      name: 'conflicts',
      type: 'expand',
      initial: 'no',
      message: `File exists, want to overwrite ${relative(file)}?`,
      choices: [
        { name: 'yes', hint: '(overwrite the file)' },
        { name: 'no', hint: '(do not overwrite the file)' },
        { name: 'all', hint: '(overwrite the file and all remaining files)' },
        { name: 'abort', hint: '(stop and exit the process)' },
        { name: 'diff', hint: '(show a diff between the new file and existing)' }
      ]
    };

    let select = new Select({ ...question, ...options });
    select.on('run', async() => {
      if (options.onRun) {
        await options.onRun.call(select);
      }
    });
    return select;
  }

  /**
   * Actions class, exposed as a static method for unit testing.
   */

  static File() {
    return File;
  }

  /**
   * Actions class, exposed as a static method for unit testing.
   */

  static Actions() {
    return Actions;
  }
}

/**
 * Expose Conflicts
 */

module.exports = Conflicts;
