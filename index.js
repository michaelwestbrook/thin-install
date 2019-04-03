#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function backup(fileName, backupName) {
  return new Promise((resolve, reject) => fs.copyFile(fileName, backupName, error => {
    if (error) {
      reject(error);
    } else {
      console.log("Created backup");
      resolve();
    }
  }));
}

function deleteFile(fileName) {
  return new Promise((resolve, reject) => fs.unlink(fileName, error => {
    if (error) {
      reject(error);
    } else {
      console.log(`Deleted ${fileName}`);
      resolve();
    }
  }));
}

function restoreBackup(fileName, backupName) {
  return new Promise((resolve, reject) => fs.copyFile(backupName, fileName, error => {
    if (error) {
      reject(error);
    } else {
      console.log(`Copied ${backupName} to ${fileName}`);
      resolve();
    }
  }));
}

function writeJsonFile(fileName, json) {
  return new Promise((resolve, reject) => fs.writeFile(fileName, JSON.stringify(json, null, 2), error => {
    if (error) {
      reject(error);
    } else {
      console.log("Writing");
      resolve(error);
    }
  }));
}

function install(installCommand = 'npm install') {
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

function getArgs() {
  const args = process.argv.slice(2);
  let subset, installCommand, packagePath;
  args.forEach(arg => {
    const keyValue = arg.split('=');
    if (keyValue[0].toLowerCase() === '--subset') {
      subset = keyValue[1];
    } else if (keyValue[0].toLowerCase() === '--packagepath') {
      packagePath = keyValue[1];
    } else if (keyValue[0].toLowerCase() === '--installcommand') {
      installCommand = keyValue[1];
    }
  });

  return {
    subset: subset,
    installCommand: installCommand,
    packagePath
  }
}

const argv = getArgs();
const subsets = argv.subset;
const installCommand = argv.installCommand
const packagePath = argv.packagePath ? path.resolve(argv.packagePath) : path.join(process.cwd(), 'package.json');
const package = require(packagePath);
const backupName = `${packagePath}.backup`;
const dev = package.devDependencies ? package.devDependencies : {};
const prod = package.dependencies ? package.dependencies : {};
const subsetDependencies = subsets.split(',')
  .map(subset => Object.assign([], package.subsets[subset.trim]))
  .reduce((accumulator, currentValue) => {
    currentValue.forEach(value => accumulator.push(value));
    return accumulator;
  });
const devDependencies = pick(dev, subsetDependencies);
const prodDependencies = pick(prod, subsetDependencies);
package.devDependencies = Object.assign(devDependencies, prodDependencies);
package.dependencies = {};
console.log(`Generated Package:\n${JSON.stringify(package, null, 2)}`);
return backup(packagePath, backupName)
  .then(() => writeJsonFile(packagePath, package))
  .then(() => install(installCommand))
  .then(() => restoreBackup(packagePath, backupName))
  .then(() => deleteFile(backupName))
  .catch(console.error);