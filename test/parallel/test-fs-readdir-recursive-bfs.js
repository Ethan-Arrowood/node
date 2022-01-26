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
 *       |- e
 *    |- f
 *    |- g
 * |- h
 */
const fileStructure = [
  'a',
  ['foo', ['b', 'c']],
  ['bar', [['fuzz', ['d', 'e']], 'f', 'g']],
  'h',
];

// Make sure tmp directory is clean
tmpdir.refresh();

function createFiles(path, fileStructure) {
  for (const fileOrDir of fileStructure) {
    if (typeof fileOrDir === 'string') {
      fs.closeSync(fs.openSync(`${path}/${fileOrDir}`, 'w'));
    } else {
      fs.mkdirSync(`${path}/${fileOrDir[0]}`);
      createFiles(`${path}/${fileOrDir[0]}`, fileOrDir[1]);
    }
  }
}

createFiles(readdirDir, fileStructure);

function assertDirents(expected, dirents) {
  assert.strictEqual(expected.length, dirents.length);
  for (const [i, dirent] of dirents.entries()) {
    assert(dirent instanceof fs.Dirent);
    assert.strictEqual(dirent.name, expected[i]);
    assert.strictEqual(dirent.isFile(), true);
    assert.strictEqual(dirent.isDirectory(), false);
    assert.strictEqual(dirent.isSocket(), false);
    assert.strictEqual(dirent.isBlockDevice(), false);
    assert.strictEqual(dirent.isCharacterDevice(), false);
    assert.strictEqual(dirent.isFIFO(), false);
    assert.strictEqual(dirent.isSymbolicLink(), false);
  }
}

async function processStream(stream) {
  stream.setEncoding('utf-8');
  let data = '';
  for await (const chunk of stream.read()) {
    data += (chunk);
  }
  return data.split(',');
}

// Breadth First Cases

const breadthFirstExpected = [/** TODO */];

{
  /**
   * breadth-first case:
   * - returns a list of file paths in a breadth-first order
   */

  // sync
  assert.deepStrictEqual(
    breadthFirstExpected,
    fs.readdirSync(readdirDir, { recursive: { algorithm: 'breadth-first' } })
  );

  // async
  fs.readdir(
    readdirDir,
    { recursive: { algorithm: 'breadth-first' } },
    common.mustSucceed((f) => {
      assert.deepStrictEqual(breadthFirstExpected, f.sort());
    })
  );
}

{
  /**
   * breadth-first withFileTypes case:
   * - returns a list of fs.Dirent objects in a breadth-first order
   */

  // sync
  const resultDirents = fs.readdirSync(
    readdirDir,
    { recursive: { algorithm: 'breadth-first' }, withFileTypes: true }
  );
  assertDirents(breadthFirstExpected, resultDirents);

  // async
  fs.readdir(
    readdirDir,
    {
      recursive: { algorithm: 'breadth-first' },
      withFileTypes: true
    },
    common.mustSucceed((resultDirents) => {
      assertDirents(breadthFirstExpected, resultDirents.sort());
    })
  );
}

{
  /**
   * breadth-first stream case:
   * - returns a readable stream of file paths in a breadth-first order
   */

  // sync
  const resultStream = fs.readdirSync(
    readdirDir,
    { recursive: { algorithm: 'breadth-first', result: 'stream' } }
  );
  const result = processStream(resultStream);
  assert.deepStrictEqual(breadthFirstExpected, result);

  // async
  fs.readdir(
    readdirDir,
    { recursive: { algorithm: 'breadth-first', result: 'stream' } },
    common.mustSucceed((resultStream) => {
      const result = processStream(resultStream);
      assert.deepStrictEqual(breadthFirstExpected, result.sort());
    })
  );
}

{
  /**
   * breadth-first stream and withFileTypes case:
   * - returns a readable stream of file paths in a breadth-first order
   */

  // sync
  const resultStream = fs.readdirSync(
    readdirDir,
    {
      recursive: { algorithm: 'breadth-first', result: 'stream' },
      withFileTypes: true
    }
  );
  const resultDirents = processStream(resultStream);
  assertDirents(breadthFirstExpected, resultDirents);

  // async
  fs.readdir(
    readdirDir,
    {
      recursive: { algorithm: 'breadth-first', result: 'stream' },
      withFileTypes: true
    },
    common.mustSucceed((resultStream) => {
      const resultDirents = processStream(resultStream);
      assertDirents(breadthFirstExpected, resultDirents.sort());
    })
  );
}
