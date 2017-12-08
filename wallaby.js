module.exports = function (wallaby) {

  return {
    files: [
      'src/**/*.ts'
    ],

    tests: [
      'specs/**/*.spec.ts'
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