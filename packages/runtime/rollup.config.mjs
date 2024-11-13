import { swc } from 'rollup-plugin-swc3'
import filesize from 'rollup-plugin-filesize'

export default {
  input: 'src/index.ts',
  plugins: [filesize(), swc()],
  output: {
    file: 'dist/lai-web.js',
    format: 'esm',
  },
}
