'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const vfs = require('vinyl-fs');
const cwd = path.resolve.bind(path, __dirname, 'fixtures');
const conflicts = require('../gulp-conflicts');

const nextTick = fn => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => fn().then(resolve).catch(reject));
  });
};

describe('gulp plugin', () => {
  it('should overwrite all files when defined on options', cb => {
    let files = [];

    vfs.src('*.txt', { cwd: cwd() })
      .pipe(conflicts({ dest: cwd('dist'), overwrite: true }))
      .on('error', cb)
      .on('data', file => {
        files.push(file);
      })
      .on('end', () => {
        assert(files.length >= 4);
        cb();
      });
  });

  it('should prompt for feedback ("yes")', function(cb) {
    this.timeout(200000);
    let errored = false;
    let files = [];
    let onRun;

    let callback = err => {
      if (errored) return;
      if (err) {
        errored = true;
        cb(err);
        return;
      }
      cb();
    };

    let options = {
      dest: cwd('dist'),
      show: false,
      onConflict(existing, proposed, opts) {
        opts.onRun = async function() {
          await nextTick(() => this.keypress(0)); // yes
          await nextTick(() => this.submit());
        };
      }
    };

    vfs.src(['*.txt'], { cwd: cwd() })
      .pipe(conflicts(options))
      .on('error', callback)
      .on('data', file => files.push(file))
      .on('end', () => {
        assert.equal(files.length, 4);
        callback();
      })
  });

  it('should prompt for feedback ("no")', function(cb) {
    this.timeout(200000);
    let errored = false;
    let files = [];
    let onRun;

    let callback = err => {
      if (errored) return;
      if (err) {
        errored = true;
        cb(err);
        return;
      }
      cb();
    };

    let options = {
      dest: cwd('dist'),
      show: false,
      onConflict(existing, proposed, opts) {
        opts.onRun = async function() {
          await nextTick(() => this.keypress(1)); // no
          await nextTick(() => this.submit());
        };
      }
    };

    vfs.src(['*.txt'], { cwd: cwd() })
      .pipe(conflicts(options))
      .on('error', callback)
      .on('data', file => files.push(file))
      .on('end', () => {
        assert.equal(files.length, 1);
        callback();
      })
  });

  it('should prompt for feedback ("all")', function(cb) {
    this.timeout(200000);
    let errored = false;
    let files = [];
    let onRun;

    let callback = err => {
      if (errored) return;
      if (err) {
        errored = true;
        cb(err);
        return;
      }
      cb();
    };

    let options = {
      dest: cwd('dist'),
      show: false,
      onConflict(existing, proposed, opts) {
        opts.onRun = async function() {
          await nextTick(() => this.keypress(2)); // all
          await nextTick(() => this.submit());
        };
      }
    };

    vfs.src(['*.txt'], { cwd: cwd() })
      .pipe(conflicts(options))
      .on('error', callback)
      .on('data', file => files.push(file))
      .on('end', () => {
        assert.equal(files.length, 5);
        callback();
      })
  });

  it('should prompt for feedback ("abort")', function(cb) {
    this.timeout(200000);

    let onRun = async function() {
      await nextTick(() => this.keypress(3)); // abort
      await nextTick(() => this.submit());
    };

    let files = [];
    let errored = false;
    let callback = err => {
      if (errored) return;
      if (err) {
        errored = true;
        cb(err);
        return;
      }
      cb();
    };

    vfs.src(['*.txt'], { cwd: cwd() })
      .pipe(conflicts({ dest: cwd('dist'), show: false, onRun }))
      .on('error', callback)
      .on('data', file => files.push(file))
      .on('end', () => {
        assert.equal(files.length, 0);
        callback();
      })
  });

  it('should prompt for feedback ("diff")', function(cb) {
    this.timeout(200000);
    let errored = false;
    let files = [];

    let callback = err => {
      if (errored) return;
      if (err) {
        errored = true;
        cb(err);
        return;
      }
      cb();
    };

    let seen = new Set();
    let onRun = async function() {
      await nextTick(() => this.keypress(4)); // all
      await nextTick(() => this.submit());
    };

    let options = {
      dest: cwd('dist'),
      show: false,
      onConflict(existing, proposed, opts) {
        if (seen.has(proposed)) {
          opts.onRun = async function() {
            await nextTick(() => this.keypress(0)); // "yes"
            await nextTick(() => this.submit());
          };
        }
        seen.add(proposed);
      }
    };

    vfs.src(['*.txt'], { cwd: cwd() })
      .pipe(conflicts({ ...options, onRun }))
      .on('error', callback)
      .on('data', file => files.push(file))
      .on('end', () => {
        assert.equal(files.length, 4);
        callback();
      })
  });
});
