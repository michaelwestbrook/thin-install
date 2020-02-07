const fs = require('fs');
const cp = require('child_process');

module.exports.backup = function (fileName, backupName) {
  return new Promise((resolve, reject) => fs.copyFile(fileName, backupName, error => {
    if (error) {
      reject(error);
    } else {
      console.log("Created backup");
      resolve();
    }
  }));
}

module.exports.deleteFile = function (fileName) {
  return new Promise((resolve, reject) => fs.unlink(fileName, error => {
    if (error) {
      reject(error);
    } else {
      console.log(`Deleted ${fileName}`);
      resolve();
    }
  }));
}

module.exports.restoreBackup = function (fileName, backupName) {
  return new Promise((resolve, reject) => fs.copyFile(backupName, fileName, error => {
    if (error) {
      reject(error);
    } else {
      console.log(`Copied ${backupName} to ${fileName}`);
      resolve();
    }
  }));
}

module.exports.writeJsonFile = function (fileName, json) {
  return new Promise((resolve, reject) => fs.writeFile(fileName, JSON.stringify(json, null, 2), error => {
    if (error) {
      reject(error);
    } else {
      console.log("Writing");
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
        console.log(`Install exited with code ${code}`);
        resolve();
      }
    });
  });
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

/**
 * Installs a subset of dependencies for an NPM project.
 * 
 * @param {string} subsets Name of the subset(s) to install. Use comma to separate multiple subsets.
 * @param {string} packagePath Location of the package.json that contains the subset of dependencies. Defaults to `./package.json
 * @param {string} installCommand Custom install command. Default: `npm install`
 */
module.exports = function(subsets, packagePath, installCommand) {
  const package = require(packagePath);
  if (!package.subsets || package.subsets.length === 0) {
    throw new Error(`Package ${packagePath} does not contain any subsets`);
  }
  const backupName = `${packagePath}.backup`;
  const dev = package.devDependencies ? package.devDependencies : {};
  const prod = package.dependencies ? package.dependencies : {};
  const subsetDependencies = subsets.split(',')
    .map(subset => Object.assign([], package.subsets[subset.trim()]))
    .reduce((accumulator, currentValue) => {
      currentValue.forEach(value => accumulator.push(value));
      return accumulator;
    });
  const devDependencies = pick(dev, subsetDependencies);
  const prodDependencies = pick(prod, subsetDependencies);
  package.devDependencies = Object.assign(devDependencies, prodDependencies);
  package.dependencies = {};
  console.log(`Generated Package:\n${JSON.stringify(package, null, 2)}`);
  return module.exports.backup(packagePath, backupName)
    .then(() => module.exports.writeJsonFile(packagePath, package))
    .then(() => module.exports.install(installCommand))
    .then(() => module.exports.restoreBackup(packagePath, backupName))
    .then(() => module.exports.deleteFile(backupName));
}
