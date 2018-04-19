'use strict';

require('mocha');
const conflicts = require('..');
const util = require('util');
const path = require('path');
const assert = require('assert');
const glob = util.promisify(require('glob'));
const cwd = path.resolve.bind(path, __dirname, 'fixtures');

describe('conflicts.files', function() {
  it('should overwrite all files when options.overwrite is true', async function() {
    const files = await glob('*.txt', { cwd: cwd() });
    const actual = await conflicts.files(files, { cwd: cwd(), dest: cwd('dist'), overwrite: true });
    assert.equal(actual.length, 4);
  });

  it.skip('should prompt for feedback', async function() {
    this.timeout(20000);

    const files = await glob('*.txt', { cwd: cwd() });
    const actual = await conflicts.files(files, { cwd: cwd(), dest: cwd('dist') });
    assert.equal(actual.length, 3);
  });
});
