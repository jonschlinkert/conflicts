'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const File = require('vinyl');
const diff = require('../lib/diff');
const fixture = path.resolve.bind(path, __dirname, 'fixtures');
const buffer = name => fs.readFileSync(fixture(name));

describe('diff', function() {
  it('should export a function', function() {
    assert.equal(typeof diff, 'function');
  });

  describe('auto', function() {
    it('should automatically diff based on type', function() {
      const proposed = new File({ path: fixture('dist/a.txt'), contents: buffer('dist/a.txt') });
      const existing = new File({ path: fixture('a.txt'), contents: buffer('a.txt') });
      const actual = diff(existing, proposed);
      assert(/\+ added/.test(actual));
      assert(/- removed/.test(actual));
    });

    it('should automatically diff based on type', function() {
      const hash1 = crypto.createHmac('sha256', 'abcdefg').digest('hex');
      const hash2 = hash1.split('a').join('zz').split('e').join('x');

      const actual = diff.text(hash1, hash2);
      assert(/\+ added/.test(actual));
      assert(/- removed/.test(actual));
    });
  });

  describe('binary', function() {
    it('should return a diff of two image files', function() {
      const proposed = new File({ path: fixture('Robotocat.png'), contents: buffer('Robotocat.png') });
      const existing = new File({ path: fixture('octocat.png'), contents: buffer('octocat.png') });
      const actual = diff.binary(existing, proposed);
      // console.log(actual);
      assert.equal(typeof actual, 'string');
      assert(/Existing/i.test(actual));
      assert(/Replacement/i.test(diff.binary(existing, proposed)));
      assert(/Diff/i.test(diff.binary(existing, proposed)));
    });

    it.skip('should return a diff of two non-image binary files', function() {
      const proposed = new File({ path: fixture('foo.pdf'), contents: buffer('foo.pdf') });
      const existing = new File({ path: fixture('dist/foo.pdf'), contents: buffer('dist/foo.pdf') });
      const actual = diff.binary(existing, proposed);
      // console.log(actual);
      assert.equal(typeof actual, 'string');
      assert(/Existing/i.test(actual));
      assert(/Replacement/i.test(diff.binary(existing, proposed)));
      assert(/Diff/i.test(diff.binary(existing, proposed)));
    });
  });

  describe('text', function() {
    it.skip('should return a diff of two text files', function() {
      const proposed = new File({ path: fixture('a.txt'), contents: buffer('a.txt') });
      const existing = new File({ path: fixture('dist/a.txt'), contents: buffer('dist/a.txt') });
      const actual = diff.binary(existing, proposed);
      // console.log(actual);
      assert.equal(typeof actual, 'string');
      assert(/Existing/i.test(actual));
      assert(/Replacement/i.test(diff.binary(existing, proposed)));
      assert(/Diff/i.test(diff.binary(existing, proposed)));
    });
  });
});
