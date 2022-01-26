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

// Depth First Cases

const depthFirstExpected = [/** TODO */];

{
  /**
   * depth-first case:
   * - returns a list of file paths in a depth-first order
   */

  // sync
  assert.deepStrictEqual(
    depthFirstExpected,
    fs.readdirSync(readdirDir, { recursive: { algorithm: 'depth-first' } })
  );

  // async
  fs.readdir(
    readdirDir,
    { recursive: { algorithm: 'depth-first' } },
    common.mustSucceed((f) => {
      assert.deepStrictEqual(depthFirstExpected, f.sort());
    })
  );
}

{
  /**
   * depth-first withFileTypes case:
   * - returns a list of fs.Dirent objects in a depth-first order
   */

  // sync
  const resultDirents = fs.readdirSync(
    readdirDir,
    {
      recursive: { algorithm: 'depth-first' },
      withFileTypes: true
    }
  );
  assertDirents(depthFirstExpected, resultDirents);

  // async
  fs.readdir(
    readdirDir,
    {
      recursive: { algorithm: 'depth-first' },
      withFileTypes: true
    },
    common.mustSucceed((resultDirents) => {
      assertDirents(depthFirstExpected, resultDirents.sort());
    })
  );
}

{
  /**
   * depth-first stream case:
   * - returns a readable stream of file paths in a depth-first order
   */

  // sync
  const resultStream = fs.readdirSync(
    readdirDir,
    { recursive: { algorithm: 'depth-first', result: 'stream' } }
  );
  const result = processStream(resultStream);
  assert.deepStrictEqual(depthFirstExpected, result);

  // async
  fs.readdir(
    readdirDir,
    { recursive: { algorithm: 'depth-first', result: 'stream' } },
    common.mustSucceed((resultStream) => {
      const result = processStream(resultStream);
      assert.deepStrictEqual(depthFirstExpected, result.sort());
    })
  );
}

{
  /**
   * depth-first stream and withFileTypes case:
   * - returns a readable stream of file paths in a depth-first order
   */

  // sync
  const resultStream = fs.readdirSync(
    readdirDir,
    {
      recursive: { algorithm: 'depth-first', result: 'stream' },
      withFileTypes: true
    }
  );
  const resultDirents = processStream(resultStream);
  assertDirents(depthFirstExpected, resultDirents);

  // async
  fs.readdir(
    readdirDir,
    {
      recursive: { algorithm: 'depth-first', result: 'stream' },
      withFileTypes: true
    },
    common.mustSucceed((resultStream) => {
      const resultDirents = processStream(resultStream);
      assertDirents(depthFirstExpected, resultDirents.sort());
    })
  );
}
