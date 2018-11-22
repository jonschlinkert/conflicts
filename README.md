# conflicts [![NPM version](https://img.shields.io/npm/v/conflicts.svg?style=flat)](https://www.npmjs.com/package/conflicts) [![NPM monthly downloads](https://img.shields.io/npm/dm/conflicts.svg?style=flat)](https://npmjs.org/package/conflicts) [![NPM total downloads](https://img.shields.io/npm/dt/conflicts.svg?style=flat)](https://npmjs.org/package/conflicts) [![Linux Build Status](https://img.shields.io/travis/jonschlinkert/conflicts.svg?style=flat&label=Travis)](https://travis-ci.org/jonschlinkert/conflicts)

> Detect file conflicts.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save conflicts
```

## Usage

```js
const Conflicts = require('conflicts');
const conflicts = new Conflicts();
```

## Options

The following options may be used with the [.detect](#detect) method.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| Option | Type | Default | Description |

Additionally, options are forwarded to [enquirer](https://github.com/enquirer/enquirer) for customizing prompt behavior. See the [unit tests](test/gulp.js) for examples.

## API

### [Conflicts](index.js#L26)

Create an instance of `Conflicts` with the given `options` and optional [Vinyl](https://github.com/gulpjs/vinyl) constructor.

**Params**

* `options` **{Object}**
* `File` **{Function}**: Optionally pass a [vinyl](https://github.com/gulpjs/vinyl) contructor, otherwise the default `File` class is used.
* `returns` **{Conflicts}**: Returns an instance of Conflicts.

**Example**

```js
const Conflicts = require('conflicts');
const conflicts = new Conflicts({}, require('vinyl'));
```

### [.detectFile](index.js#L60)

Compares an `existing` (old) file to a new `proposed` file, then prompts for an action if the files are not equal. If the contents of both files is identical, no action is taken, otherwise you will be prompted to choose the action to take. See the unit tests for examples of how to skip prompts.

**Params**

* `proposedFile` **{Object}**: New file.
* `existingFile` **{Object}**: Existing file.
* `options` **{Object}**
* `returns` **{Promise}**: Returns a promise with the action that was taken.

**Example**

```js
conflicts.detect(fileA, fileB)
  .then(action => console.log('Action taken:', action))
  .catch(console.error)
```

### [.detectFile](index.js#L124)

Same as [.detect](#detect), except the second argument is a string to an existing file on the file system.

**Params**

* `proposed` **{Object}**: New file.
* `existingPath` **{Object}**: File path to existing file.
* `options` **{Object}**
* `returns` **{Promise}**: Returns a promise with the action that was taken.

**Example**

```js
conflicts.detectFile(file, 'path/to/file.txt')
  .then(action => console.log('Action taken:', action))
  .catch(console.error)
```

### [.files](index.js#L145)

Runs [detect](#detect) on an array of "proposed" files.

**Params**

* `files` **{Array}**: Array of file objects.
* `options` **{Object}**
* `returns` **{Array<object>}**

**Example**

```js
conflicts.files([fileA, fileB, fileC])
  .then(action => console.log('Action taken:', action))
  .catch(console.error)
```

### [.diffFiles](index.js#L186)

Takes an array of "proposed" files, and returns an array of strings, where each string represents a [diff](https://github.com/kpdecker/jsdiff) of the proposed file's contents versus an existing file's contents.

**Params**

* `files` **{Array}**
* `options` **{Object}**
* `returns` **{Array<string>}**

**Example**

```js
conflicts.diffFiles([fileA, fileB, fileC])
  .then(diffs => {
    diffs.forEach(diff => console.log(diff));
  })
  .catch(console.error)
```

### [.isEqual](index.js#L233)

Returns true if an `fileA` (existing/old) file appears to be identical to a `fileB` (proposed/new) file.

**Params**

* `proposed` **{Object}**: [vinyl](https://github.com/gulpjs/vinyl) file representing a proposed (new) file
* `existing` **{Object}**: [vinyl](https://github.com/gulpjs/vinyl) file representing an existing (old) file
* `options` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
console.log(conflicts.isEqual(fileA, fileB));
```

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2018, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on November 22, 2018._