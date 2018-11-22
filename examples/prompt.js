const { prompt } = require('..');

const file = {
  path: __dirname + '/fixtures/a.txt',
  contents: Buffer.from('a1\na2\na3\na4')
};

const options = {
  path: process.cwd() + '/foo',
  cwd: process.cwd()
};

prompt(file, options).run()
  .then(console.error)
  .catch(console.error)
