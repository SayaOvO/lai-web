import { swc } from 'rollup-plugin-swc3'
import filesize from 'rollup-plugin-filesize'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: 'src/index.ts',
  plugins: [filesize(), swc(), nodeResolve(), commonjs()],
  output: {
    file: 'dist/lai-web.js',
    format: 'esm',
  },
}
