#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
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

const argv = require('yargs').argv;
const subset = argv.subset;
const installCommand = argv.installCommand
const packagePath = path.join(process.cwd(), 'package.json');
const package = require(packagePath);
const backupName = `${packagePath}.backup`;
package.devDependencies = _.pick(package.devDependencies, package.subsets[subset].include);
package.dependencies = {};
return backup(packagePath, backupName)
  .then(() => writeJsonFile(packagePath, package))
  .then(() => install(installCommand))
  .then(() => restoreBackup(packagePath, backupName))
  .then(() => deleteFile(backupName))
  .catch(console.error);
