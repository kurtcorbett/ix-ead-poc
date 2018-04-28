const compilerOptions = Object.assign(
  require('./tsconfig.json').compilerOptions,
);

module.exports = function (wallaby) {

  return {
    files: [
      { pattern: 'src/**/*.ts', load: false },
      { pattern: 'test-setup.js', instrument: false },
      { pattern: 'src/**/*.spec.ts', ignore: true },
    ],

    tests: [
      'src/**/*.spec.ts'
    ],

    testFramework: 'mocha',

    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript(compilerOptions)
    },

    setup(worker) {
      // Import test helpers (dirty-chai, sinon-chai, etc...)
      require('./test-setup.js');
    },

    env: {
      type: 'node'
    }
  };
};