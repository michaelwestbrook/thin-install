const fs = require('fs');

const PACKAGE_BASE = './test/package-base.json';
const PACKAGE_JSON = './test/package.json';

describe('Thin Install', () => {
  let packageBaseContent;

  async function readFile(file) {
    return new Promise((resolve, reject) => fs.readFile(file, 'utf8', (error, data) => {
      if (error) {
        return reject(error);
      }

      resolve(data);
    }));
  }

  beforeAll(async () => packageBaseContent = await readFile(PACKAGE_BASE));

  beforeEach(async () => readFile(PACKAGE_BASE)
    .then(data => new Promise((resolve, reject) => fs.writeFile(PACKAGE_JSON, data, writeError => {
      if (writeError) {
        return reject(writeError);
      }

      resolve();
    }))));

  const installer = require('../index');
  it('creates a backs up of package.json', async () =>
    installer.backup(PACKAGE_JSON, `${PACKAGE_JSON}-backup`)
      .then(() => readFile(`${PACKAGE_JSON}-backup`))
      .then(data => expect(data).toBe(packageBaseContent)));

  it('deletes the backup file', async () =>
    installer.deleteFile(PACKAGE_JSON)
      .then(() => new Promise(resolve => fs.exists(PACKAGE_JSON, exists => resolve(expect(exists).toBe(false))))));

  it('restores the backup', async () => installer.backup(PACKAGE_JSON, `${PACKAGE_JSON}-backup`)
    .then(() => new Promise((resolve, reject) => fs.appendFile(PACKAGE_JSON, 'arbitrary data', error => {
      if (error) {
        return reject(error);
      }

      resolve();
    }))
      .then(() => installer.restoreBackup(PACKAGE_JSON, `${PACKAGE_JSON}-backup`))
      .then(() => readFile(PACKAGE_JSON))
      .then(data => expect(data).toBe(packageBaseContent))));

  it('installs the correct subset', () => {
    const subset = installer.generateSubset('foo', PACKAGE_JSON);
    expect(Object.keys(subset.devDependencies).length).toBe(1);
    expect(subset.devDependencies.a).toBe('1.0.0');
    expect(Object.keys(subset.dependencies).length).toBe(0);
  });

  it('installs the correct subsets', () => {
    const subset = installer.generateSubset('bar', PACKAGE_JSON);
    console.log(subset)
    expect(Object.keys(subset.devDependencies).length).toBe(2);
    expect(subset.devDependencies.b).toBe('2.2.2');
    expect(subset.devDependencies.c).toBe('3.3.3');
    expect(Object.keys(subset.dependencies).length).toBe(0);
  });
});
