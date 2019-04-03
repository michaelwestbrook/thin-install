# thin-install

For large projects it can be a pain to install the entire project if you only need a subset of dependencies to accomplish a task.

Install thin-install
`npm install thin-install`

Then add the subsets object to your package.json

```javascript
{
  "name": "foo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "dependency-a": "1.0.0",
    "dependency-b": "2.2.2",
    "dependency-c": "3.3.3"
  },
  "subsets": {
    "thinInstall": [
      "dependecny-a",
      "dependency-b"
    ]
  }
}
```

Run tool
`./node_modules/.bin/thin-install --subset=thinInstall,anotherSubset`

Available options

- `--subset` - The subset to install. Separate multiple subsets with comma
- `--installCommand` - Provide a custom install command. Usefule if using Yarn or another package manager.