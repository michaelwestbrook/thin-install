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
const subset = argv.subset;
const installCommand = argv.installCommand
const packagePath = argv.packagePath ? path.resolve(argv.packagePath) : path.join(process.cwd(), 'package.json');
const package = require(packagePath);
const backupName = `${packagePath}.backup`;
package.devDependencies = pick(package.devDependencies, package.subsets[subset].include);
package.dependencies = {};
return backup(packagePath, backupName)
  .then(() => writeJsonFile(packagePath, package))
  .then(() => install(installCommand))
  .then(() => restoreBackup(packagePath, backupName))
  .then(() => deleteFile(backupName))
  .catch(console.error);