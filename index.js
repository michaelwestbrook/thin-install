const fs = require('fs');
const cp = require('child_process');

async function readJsonFile(fileName) {
  return new Promise((resolve, reject) => fs.readFile(fileName, 'utf8', (error, data) => {
    if (error) {
      return reject(error);
    }

    resolve(JSON.parse(data));
  }))
}

/**
 * Installs a subset of dependencies for an NPM project.
 * 
 * @param {string} subsets Name of the subset(s) to install. Use comma to separate multiple subsets.
 * @param {string} packagePath Location of the package.json that contains the subset of dependencies. Defaults to `./package.json
 * @param {string} installCommand Custom install command. Default: `npm install`
 */
module.exports = async function (subsets, packagePath, installCommand) {
  const backupName = `${packagePath}.backup`;
  const subsetPackage = await module.exports.generateSubset(subsets, packagePath);
  console.log(`Generated subset package.json\n${subsetPackage}`);
  return module.exports.backup(packagePath, backupName)
    .then(() => module.exports.writeJsonFile(packagePath, subsetPackage))
    .then(() => module.exports.install(installCommand))
    .then(() => module.exports.restoreBackup(packagePath, backupName))
    .then(() => module.exports.deleteFile(backupName));
}

module.exports.backup = function (fileName, backupName) {
  return new Promise((resolve, reject) => fs.copyFile(fileName, backupName, error => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  }));
}

module.exports.deleteFile = function (fileName) {
  return new Promise((resolve, reject) => fs.unlink(fileName, error => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  }));
}

module.exports.restoreBackup = function (fileName, backupName) {
  return new Promise((resolve, reject) => fs.copyFile(backupName, fileName, error => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  }));
}

module.exports.writeJsonFile = function (fileName, json) {
  return new Promise((resolve, reject) => fs.writeFile(fileName, JSON.stringify(json, null, 2), error => {
    if (error) {
      reject(error);
    } else {
      resolve(error);
    }
  }));
}

module.exports.install = function (installCommand) {
  return new Promise((resolve, reject) => {
    const child = cp.exec(installCommand);
    child.stdout.on('data', console.log);
    child.stderr.on('data', console.warn);
    child.on('error', console.error);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`Install exited with code ${code}`);
      } else {
        resolve();
      }
    });
  });
}

module.exports.generateSubset = async function (subsets, packagePath) {
  if (!packagePath) {
    throw new Error('No path provided for package.json');
  }

  const packageJson = await readJsonFile(packagePath);
  if (!packageJson.subsets || packageJson.subsets.length === 0) {
    throw new Error(`Package ${packagePath} does not contain any subsets`);
  }
  const dev = packageJson.devDependencies ? packageJson.devDependencies : {};
  const prod = packageJson.dependencies ? packageJson.dependencies : {};
  const subsetDependencies = subsets.split(',')
    .map(subset => Object.assign([], packageJson.subsets[subset.trim()]))
    .reduce((accumulator, currentValue) => {
      currentValue.forEach(value => accumulator.push(value));
      return accumulator;
    });
  const devDependencies = pick(dev, subsetDependencies);
  const prodDependencies = pick(prod, subsetDependencies);
  packageJson.dependencies = Object.assign(devDependencies, prodDependencies);
  packageJson.devDependencies = {};
  if (Object.keys(packageJson.dependencies).length === 0) {
    throw new Error(`${subsets} do not contain any dependencies`);
  }
  return packageJson;
}

/**
 * Method copied from https://github.com/tabrindle/install-subset/blob/master/index.js
 */
function pick(obj, props) {
  return Object.keys(obj)
    .filter(key => props.indexOf(key) >= 0)
    .reduce((acc, key) => Object.assign(acc, {
      [key]: obj[key]
    }), {});
};
