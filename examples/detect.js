const Conflicts = require('..');
const conflicts = new Conflicts();

const fileA = {
  path: __dirname + '/fixtures/a.txt',
  contents: Buffer.from('a1\na2\na3\na4')
};

const fileB = {
  path: __dirname + '/fixtures/b.txt',
  contents: Buffer.from('a1\nb2\nb3\na4')
};

conflicts.detect(fileB, fileA)
  .then(console.error)
  .catch(console.error)
