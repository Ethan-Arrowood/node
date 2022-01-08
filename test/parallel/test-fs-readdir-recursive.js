'use strict';

const common = require('../common');
const assert = require('assert');
const fs = require('fs');

const tmpdir = require('../common/tmpdir');

const readdirDir = tmpdir.path;
/**
 * Represents the following file structure:
 * /
 * |- a
 * |- foo
 *    |- b
 *    |- c
 * |- bar
 *    |- fuzz
 *       |- d
 *    |- e
 */
const fileStructure = [
  'a',
  ['foo', ['b','c']],
  ['bar', [['fuzz', ['d']], 'e']]
]

// Make sure tmp directory is clean
tmpdir.refresh();

function createFiles (path, fileStructure) {
  for (const fileOrDir of fileStructure) {
    if (typeof fileOrDir === 'string') {
      fs.closeSync(fs.openSync(`${path}/${fileOrDir}`, 'w'));
    } else {
      fs.mkdirSync(`${path}/${fileOrDir[0]}`);
      createFiles(`${path}/${fileOrDir[0]}`, fileOrDir[1]);
    }
  }
}

createFiles(readdirDir, fileStructure)

const expected = [ 'a', 'bar/e', 'bar/fuzz/d', 'foo/b', 'foo/c' ]

// Check the readdir Sync version
assert.deepStrictEqual(expected, fs.readdirSync(readdirDir, { recursive: true }).sort());

// Check the readdir async version
fs.readdir(readdirDir, { recursive: true }, common.mustSucceed((f) => {
  assert.deepStrictEqual(expected, f.sort());
}));
