'use strict';

const fs = require('fs');
const path = require('path');
const File = require('vinyl');
const typeOf = require('kind-of');
const through = require('through2');
const Prompt = require('prompt-expand');
const diffFile = require('./lib/diff');
const action = require('./lib/action');
const utils = require('./lib/utils');

/**
 * Detect potential conflicts between existing files and the path and
 * contents of a vinyl file. If the destination `file.path` already
 * exists on the file system:
 *
 *   1. The existing file's contents is compared with `file.contents` on the vinyl file
 *   2. If the contents of both are identical, no action is taken
 *   3. If the contents differ, the user is prompted for action
 *   4. If no conflicting file exists, the vinyl file is written to the file system
 *
 * ```js
 * app.src('foo/*.js')
 *   .pipe(app.conflicts('foo'))
 *   .pipe(app.dest('foo'));
 * ```
 * @param {String} `dest` The same desination directory passed to `app.dest()`
 * @return {String}
 * @api public
 */

function conflicts(options = {}) {
  const state = { files: [] };

  if (typeof options === 'string') {
    options = { dest: options };
  }

  if (!options.dest) {
    throw new TypeError('expected destination path to be a string or function');
  }

  return through.obj(function(file, enc, next) {
    if (file.isNull()) {
      next();
      return;
    }

    if (state.abort) {
      next();
      return;
    }

    const dest = options.dest;
    const destDir = typeof dest === 'function' ? dest(file) : dest;
    const destPath = path.join(destDir, file.basename);
    state.existing = new File({ path: destPath });
    state.file = file;

    conflicts.detect(state, options)
      .then(() => next())
      .catch(next);

  }, function(cb) {
    state.files.forEach(file => this.push(file));
    cb();
  });
}

class Conflicts {
  constructor(options = {}) {
    this.options = options;
    this.state = { files: [] };
  }

  files(files, options = {}) {

  }
}

conflicts.files = async function(files, options = {}) {
  const state = { files: [] };

  if (typeof options === 'string') {
    options = { dest: options };
  }

  const opts = Object.assign({ cwd: process.cwd() }, options);
  if (!opts.dest) {
    throw new TypeError('expected destination path to be a string or function');
  }

  for (const filepath of files) {
    const dest = opts.dest;
    const proposed = new File({ path: path.resolve(opts.cwd, filepath) });
    const destDir = typeof dest === 'function' ? dest(proposed) : dest;
    const destPath = path.join(destDir, proposed.basename);
    const existing = new File({ path: destPath });
    await conflicts.detect(proposed, existing, opts, state);
  }

  return state.files;
};

conflicts.detect = async function(proposed, existing, options = {}, state = {}) {
  state.files = state.files || [];

  // abort
  if (state.abort === true) {
    state.files = [];
    return;
  }

  if (typeof options.overwrite === 'function' && options.overwrite(proposed) === true) {
    state.files.push(proposed);
    return;
  }

  // overwrite the current proposed
  if (options.overwrite === true || state.all === true) {
    state.files.push(proposed);
    return;
  }

  if (conflict(existing, proposed)) {
    const prompt = new Prompt(createPrompt(proposed));
    state.action = await prompt.run();

    action[state.action](proposed);
    await takeAction(state, options);
  } else {
    action.skip(proposed);
  }
};

async function takeAction(state, options) {
  const { action, existing, proposed } = state;

  switch (action) {
    case 'all':
      state.all = true;
      state.files.push(proposed);
      break;
    case 'yes':
      state.files.push(proposed);
      break;
    case 'abort':
      state.abort = true;
      state.files = [];
      break;
    case 'diff':
      console.error(diffFile(existing, proposed));
      await conflicts.detect(state, options);
      break;
    case 'skip':
    case 'no':
    default: {
      // do nothing
      break;
    }
  }
}

/**
 * This is loosely based on https://github.com/SBoudrias/detect-conflict,
 * but modified to handle a vinyl file object and optimized so we don't need
 * to keep re-reading files or re-creating stat objects, etc.
 */

function conflict(existing, proposed) {
  if (!fs.existsSync(existing.path)) {
    return false;
  }

  if (!existing.stat) {
    existing.stat = fs.statSync(existing.path);
  }

  if (existing.isDirectory()) {
    return true;
  }

  if (!existing.contents) {
    existing.contents = fs.readFileSync(existing.path);
  }

  let contents = proposed.contents;
  if (!contents) {
    contents = proposed.contents = fs.readFileSync(proposed.path);
  }

  if (typeOf(contents) !== 'buffer') {
    contents = new Buffer(contents, 'utf8');
  }

  // file.contents lengths don't match, there is a conflict
  if (existing.contents.length !== contents.length) {
    return true;
  }

  // Convert each buffer to a hexadecimal string first, and then compare
  return existing.contents.toString('hex') !== contents.toString('hex');
}

/**
 * Create the question to ask when a conflict is detected
 *
 * @param {Object} `file` vinyl file
 * @return {Array} Question formatted the way inquirer expects it.
 */

function createPrompt(file) {
  return {
    name: 'conflicts',
    type: 'expand',
    default: 'x',
    message: 'File exists, want to overwrite ' + utils.relative(file) + '?',
    choices: [
      {
        key: 'y',
        name: 'Yes, overwrite this file',
        value: 'yes'
      },
      {
        key: 'n',
        name: 'No, do not overwrite this file',
        value: 'no'
      },
      {
        key: 'a',
        name: 'Overwrite this file and all remaining files',
        value: 'all'
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort'
      },
      {
        key: 'd',
        name: 'Show the difference between the existing and the new',
        value: 'diff'
      }
    ]
  };
}

module.exports = conflicts;
