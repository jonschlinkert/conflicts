'use strict';

require('mocha');
const conflicts = require('..');
const path = require('path');
const assert = require('assert');
const vfs = require('vinyl-fs');
const cwd = path.resolve.bind(path, __dirname, 'fixtures');

describe('conflicts', function() {
  it('should overwrite all files when define on options', function(cb) {
    const files = [];

    vfs.src('*.txt', { cwd: cwd() })
      .pipe(conflicts({ dest: cwd('dist'), overwrite: true }))
      .on('data', file => {
        files.push(file);
      })
      .on('end', function() {
        assert.equal(files.length, 4);
        cb();
      });
  });

  it('should prompt for feedback', function(cb) {
    this.timeout(20000);

    vfs.src('*.txt', { cwd: cwd() })
      .pipe(conflicts(cwd('dist')))
      .on('data', console.log)
      .on('end', cb)
  });
});
