module.exports = function (wallaby) {

  return {
    files: [
      { pattern: 'src/**/*.ts', load: false },
      { pattern: 'src/**/*.spec.ts', ignore: true },
    ],

    tests: [
      'src/**/*.spec.ts'
    ],

    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({
        module: 'commonjs'
      })
    },

    env: {
      type: 'node'
    }
  };
};