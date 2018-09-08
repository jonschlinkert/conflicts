'use strict';

require('time-require');
const path = require('path');
const Events = require('events');
const Prompt = require('prompt-base');
const diffFile = require('./lib/diff');
const Actions = require('./lib/actions');
const File = require('./lib/file');
const same = require('./lib/same');
const { exists, relative } = require('./lib/utils');

/**
 * Create an instance of `Conflicts` with the given `options`
 * and optional [Vinyl][vinyl] constructor.
 *
 * @name Conflicts
 * @param {Object} `options`
 * @param {Function} `File`
 * @return {Conflicts} Returns an instance of Conflicts.
 * @api public
 */

class Conflicts extends Events {
  constructor(options, Vinyl = File) {
    super();
    this.options = { cwd: process.cwd(), ...options };
    this.state = { files: [] };
    this.File = Vinyl;
  }

  /**
   * Push a file onto `state.files`.
   * @name .push
   * @param {Object} file
   * @return {undefined}
   * @api public
   */

  push(file) {
    if (!this.state.files.includes(file)) {
      this.state.files.push(file);
    }
  }

  /**
   * Returns true if an `existing` file does not appear to be identical
   * to the `proposed` file.
   *
   * @name .hasConflict
   * @param {Object} existing [vinyl][] file representing an existing file
   * @param {Object} proposed [vinyl][] file representing a new, proposed file
   * @param {Object} options
   * @return {Boolean}
   * @api public
   */

  hasConflict(existing, proposed, options) {
    return same(existing, proposed, { ...this.options, ...options }) === false;
  }

  async detect(existing, proposed, options) {
    let opts = { File: this.file, ...this.options, ...options };
    let actions = new Actions(this, opts);

    // stop processing and exit
    if (this.state.abort === true) {
      this.state.files = [];
      return 'abort';
    }

    // overwrite the all files
    if (opts.overwrite === true || this.state.all === true) {
      this.push(proposed);
      return 'all';
    }

    // overwrite the existing file
    if (typeof opts.overwrite === 'function' && await opts.overwrite(proposed) === true) {
      this.push(proposed);
      return 'yes';
    }

    // overwrite the existing file
    if (!existing.path || !exists(existing)) {
      this.push(proposed);
      return 'yes';
    }

    // detect conflict
    if (await this.hasConflict(existing, proposed, opts)) {
      if (typeof opts.onConflict === 'function') {
        await opts.onConflict(existing, proposed, opts);
      }

      let prompt = this.constructor.createPrompt(proposed, opts);
      let action = this.state.action = (proposed.action || await prompt.run());
      return await actions[action](existing, proposed, opts);
    }

    return await actions.skip(existing, proposed, opts);
  }

  /**
   * Update the state based on the given `action`.
   *
   * @name .takeAction
   * @param {String} action
   * @param {Object} existing
   * @param {Object} proposed
   * @param {Object} options
   * @return {undefined}
   * @api public
   */

  // async takeAction(action, existing, proposed, options = {}) {
  //   options.show !== false && actions[action](proposed);

  //   switch ((this.state.action = action)) {
  //     case 'yes':
  //       this.push(proposed);
  //       break;
  //     case 'no':
  //       this.state.no = true;
  //       break;
  //     case 'all':
  //       this.push(proposed);
  //       this.state.all = true;
  //       break;
  //     case 'abort':
  //       this.state.files = [];
  //       this.state.abort = true;
  //       break;
  //     case 'diff':
  //       if (options.show !== false) {
  //         console.error(diffFile(existing, proposed, options));
  //       }
  //       await this.detect(existing, proposed, options);
  //       break;
  //     case 'skip':
  //     default: {
  //       this.state.skip = true;
  //       break;
  //     }
  //   }

  //   return action;
  // }

  async diffFiles(files, options = {}) {
    if (typeof options === 'string' || typeof options === 'function') {
      options = { dest: options };
    }

    let opts = { ...this.options, ...options };
    let dest = opts.dest;
    let diffs = [];

    if (!dest) {
      throw new TypeError('expected destination path to be a string or function');
    }

    for (let filepath of files) {
      let proposed = new this.File({ path: path.resolve(opts.cwd, filepath) });
      let destDir = typeof dest === 'function' ? dest(proposed) : dest;
      let existing = new this.File({ path: path.join(destDir, proposed.basename) });
      let diff = diffFile(proposed, existing);
      if (diff) {
        diffs.push({ existing, proposed, diff });
      }
    }
    return diffs;
  }

  /**
   * Create the prompt to run when a file conflict is detected.
   *
   * @name Conflicts#toFileObject
   * @param {Object} `file` File object.
   * @return {Object} Returns the prompt to run.
   * @api public
   */

  static createPrompt(file, options = {}) {
    let { Select, Radio } = Prompt.prompts;
    let PromptCtor = options.promptType === 'select' ? Select : Radio;
    let question = {
      name: 'conflicts',
      type: 'expand',
      initial: 'no',
      message: `File exists, want to overwrite ${relative(file)}?`,
      choices: [
        { message: 'yes', hint: '(overwrite the file)' },
        { message: 'no', hint: '(do not overwrite the file)' },
        { message: 'all', hint: '(overwrite the file and all remaining files)' },
        { message: 'abort', hint: '(stop and exit the process)' },
        { message: 'diff', hint: '(show a diff between the new file and existing)' }
      ]
    };
    return new PromptCtor({ ...options, ...question });
  }
}

/**
 * Expose Conflicts
 */

module.exports = Conflicts;
