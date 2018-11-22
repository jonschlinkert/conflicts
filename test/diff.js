'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const File = require('../lib/file');
const diff = require('../lib/diff');
const fixture = path.resolve.bind(path, __dirname, 'fixtures');
const buffer = name => fs.readFileSync(fixture(name));

describe('diff', () => {
  it('should export a function', () => {
    assert.equal(typeof diff, 'function');
  });

  describe('auto', () => {
    it('should automatically diff based on type', () => {
      let proposed = new File({ path: fixture('dist/a.txt'), contents: buffer('dist/a.txt') });
      let existing = new File({ path: fixture('a.txt'), contents: buffer('a.txt') });
      let actual = diff(existing, proposed);
      assert(/\+ added/.test(actual));
      assert(/- removed/.test(actual));
    });

    it('should automatically diff based on type', () => {
      let hash1 = crypto.createHmac('sha256', 'abcdefg').digest('hex');
      let hash2 = hash1.split('a').join('zz').split('e').join('x');
      let actual = diff.text({ contents: hash1 }, { contents: hash2 });
      assert(/\+ added/.test(actual));
      assert(/- removed/.test(actual));
    });
  });

  describe('binary', () => {
    it('should return a diff of two image files', () => {
      let proposed = new File({ path: fixture('Robotocat.png'), contents: buffer('Robotocat.png') });
      let existing = new File({ path: fixture('octocat.png'), contents: buffer('octocat.png') });
      let actual = diff.image(existing, proposed);
      assert.equal(typeof actual, 'string');
      assert(/Existing/i.test(actual));
      assert(/Replacement/i.test(actual));
      assert(/Diff/i.test(actual));
    });

    it('should return a diff of two non-image binary files', () => {
      let proposed = new File({ path: fixture('foo.pdf'), contents: buffer('foo.pdf') });
      let existing = new File({ path: fixture('dist/foo.pdf'), contents: buffer('dist/foo.pdf') });
      let actual = diff.binary(existing, proposed);
      assert.equal(typeof actual, 'string');
      assert(/Existing/i.test(actual));
      assert(/Replacement/i.test(actual));
      assert(/Diff/i.test(actual));
    });
  });

  describe('text', () => {
    it('should return a diff of two text files', () => {
      let proposed = new File({ path: fixture('a.txt'), contents: buffer('a.txt') });
      let existing = new File({ path: fixture('dist/a.txt'), contents: buffer('dist/a.txt') });
      let actual = diff.binary(existing, proposed);
      assert.equal(typeof actual, 'string');
      assert(/Existing/i.test(actual));
      assert(/Replacement/i.test(actual));
      assert(/Diff/i.test(actual));
    });
  });
});
