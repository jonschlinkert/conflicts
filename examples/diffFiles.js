// require('time-require');
console.time('total');
process.on('exit', () => console.timeEnd('total'));
const Conflicts = require('..');
const conflicts = new Conflicts();

let oldFile = { path: __dirname + '/a.txt', contents: Buffer.from('a1\na2\na3\na4') };
let newFile = { path: __dirname + '/b.txt', contents: Buffer.from('a1\na2\na7\na9') };
let diffs = conflicts.diffFiles([oldFile, newFile], { diffChars: true });

for (let ele of diffs) {
  console.log(ele.proposed.path);
  console.log(ele.existing.path);
  console.log(ele.diff);
  console.log();
}


