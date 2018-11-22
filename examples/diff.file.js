// require('time-require');
console.time('total');
process.on('exit', () => console.timeEnd('total'));
const diff = require('../lib/diff');

let oldFile = { path: __dirname + '/a.txt', contents: Buffer.from('a1\na2') };
let newFile = { path: __dirname + '/b.txt', contents: Buffer.from('a1\na3') };
console.log(diff.file(oldFile, newFile));
