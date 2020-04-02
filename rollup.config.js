const resolve = require('@rollup/plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const { terser } = require('rollup-plugin-terser');

export default {
  input: 'src/index.js',
  output: {
    file: `${__dirname}/dist/extension.js`,
    format: 'cjs',
    exports: 'named',
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    terser(),
  ],
};
