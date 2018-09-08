'use strict';

require('mocha');
const Conflicts = require('..');
const util = require('util');
const path = require('path');
const assert = require('assert');
const glob = util.promisify(require('glob'));
const cwd = path.resolve.bind(path, __dirname, 'fixtures');
let conflicts;

describe('conflicts.files', () => {
  beforeEach(() => (conflicts = new Conflicts()));

  it('should overwrite all files when options.overwrite is true', async () => {
    let files = await glob('*.txt', { cwd: cwd() });
    let actual = await conflicts.diffFiles(files, { cwd: cwd(), dest: cwd('dist'), overwrite: true });
    assert.equal(actual.length, 5);
  });

  it('should prompt for feedback', async function() {
    this.timeout(2000);
    let files = await glob('*.txt', { cwd: cwd() });
    let actual = await conflicts.diffFiles(files, { cwd: cwd(), dest: cwd('dist') });
    assert.equal(actual.length, 5);
  });
});
