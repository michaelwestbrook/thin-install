const fs = require('fs');

describe("Thin Install", () => {
  beforeEach(async () => {
    await new Promise((resolve, reject) => {
      fs.readFile('test/package-base.json', (readError, data) => {
        if (readError) {
          return reject(readError);
        }

        fs.writeFile('test/package.json', data, (writeError) => {
          if (writeError) {
            return reject(writeError);
          }

          resolve();
        });
      })
    });
  });

  const installer = require('../index');
  it("creates a backs up of package.json", () => {
    
  });
})