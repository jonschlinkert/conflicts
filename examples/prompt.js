const { createPrompt } = require('..');

createPrompt({ path: process.cwd() + '/foo', cwd: process.cwd() }).run()
  .then(console.error)
  .catch(console.error)
