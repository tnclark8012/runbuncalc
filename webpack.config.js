const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [{
  mode: 'development',
  entry: {
    extensions: './src/extensions/main.ts',
    core: './src/extensions/core/main.ts',
    sandbox: './src/sandbox/main.ts',
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
    new CopyWebpackPlugin({
      patterns: [
        { from: './*.html', to: '[name][ext]', context: 'src' },
        { from: './js/data/sets/gen8.js', to: 'js/data/sets/gen8.js', context: 'src' },
      ],
    }),
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