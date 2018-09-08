'use strict';

require('time-require');
console.time('total');
process.on('exit', () => console.timeEnd('total'));
const Conflicts = require('..');
const conflicts = new Conflicts();

let file1 = { contents: Buffer.from('a') };
let file2 = { contents: Buffer.from('b') };

conflicts.takeAction('diff', file1, file2, { fs: false })
  .catch(console.error);
