import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index.js',
  format: 'cjs',
  plugins: [ babel() ],
  external: ['node-localstorage', 'util', 'fs', 'path', 'abstract-leveldown'],
  dest: 'index.js'
}