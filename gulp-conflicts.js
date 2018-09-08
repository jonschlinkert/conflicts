'use strict';

const path = require('path');
const through = require('through2');
const Conflicts = require('./');

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
 *   .pipe(conflicts('foo'))
 *   .pipe(app.dest('foo'));
 * ```
 * @param {String} `dest` The same desination directory passed to `app.dest()`
 * @return {String}
 * @api public
 */

module.exports = options => {
  if (typeof options === 'string' || typeof options === 'function') {
    options = { dest: options };
  }

  if (!options.dest) {
    throw new TypeError('expected destination path to be a string or function');
  }

  let conflicts = new Conflicts(options);
  let files = [];

  return through.obj((file, enc, next) => {
    if (conflicts.state.stop === true || file.isNull()) {
      next();
      return;
    }

    let File = file.constructor;
    let dest = options.dest;
    let destDir = typeof dest === 'function' ? dest(file) : dest;
    let destPath = path.join(destDir, file.basename);
    let existing = new File({ path: destPath });

    conflicts.detect(existing, file, options)
      .then(() => next())
      .catch(next);

  }, function(cb) {
    conflicts.state.files.forEach(file => this.push(file));
    cb();
  });
};
