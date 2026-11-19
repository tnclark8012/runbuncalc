import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import offline from './offline-plugin.cjs';
import webpack from 'webpack';
import {execFileSync} from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const dexRoot = path.dirname(require.resolve('@runbuncalc/rbdex-data/package.json'));

export default [{
  mode: 'development',
  entry: {
    extensions: './src/extensions/main.ts',
    core: './src/extensions/core/main.ts',
    sandbox: './src/sandbox/main.ts',
    'snapshot-decoder': './src/exporter/run-and-bun/page.ts',
    worker: './src/worker/impl/worker.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new webpack.DefinePlugin({
      __REPORT_BUILD__: JSON.stringify({
        revision: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
        builtAt: new Date().toISOString(),
        dexVersion: require('@runbuncalc/rbdex-data/package.json').version,
      }),
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './*.html', to: '[name][ext]', context: 'src' },
        { from: './js/data/sets/gen8.js', to: 'js/data/sets/gen8.js', context: 'src' },
        { from: './extensions/ux/svgs/**/*.svg', to: 'extensions/ux/svgs/[name][ext]', context: 'src' },
        { from: './css/theme-variables.css', to: 'css/theme-variables.css', context: 'src' },
        { from: 'dist/sprites/*.png', context: dexRoot, to: 'pokemon-sprites/[name][ext]' },
        { from: 'LICENSE', context: dexRoot, to: 'vendor/rbdex/AGPL-3.0.txt' },
        {
          from: '{pokedex.js,learnsets.js,moves.js,package.json,DATA-PACKAGE.md,package/*.cjs}',
          context: dexRoot,
          to: 'vendor/rbdex/source/[path][name][ext]',
        },
        {
          from: 'dist/{SPRITES-LICENCE.txt,SPRITES-README.md,METADATA-LICENSE.md,sprite-sources.json,pokemon.csv}',
          context: dexRoot,
          to: 'vendor/rbdex/[name][ext]',
        },
      ],
    }),
    new offline.OfflinePlugin(),
  ],
},
{
  mode: 'development',
  entry: {
    worker: './src/worker/impl/worker.ts',
  },
  target: 'webworker',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: './js/data/sets/gen8.js', to: 'js/data/sets/gen8.js', context: 'src' },
      ],
    }),
  ],
}];