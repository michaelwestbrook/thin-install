#!/usr/bin/env node
const thinInstall = require('./index');
const argv = require('yargs').options({
  subset: {
    type: 'string',
    demandOption: true,
    describe: 'Name of the subset(s) to install. Use comma to separate multiple subsets.',
    alias: 's'
  },
  packagePath: {
    type: 'string',
    describe: 'Location of the package.json that contains the subset of dependencies. Defaults to `./package.json',
    default: './package.json',
    alias: 'p'
  },
  installCommand: {
    type: 'string',
    describe: 'Custom install command. Default: `npm install`',
    default: 'npm install',
    alias: 'i'
  }
}).argv;

thinInstall(argv.subset, argv.packagePath, argv.installCommand);
