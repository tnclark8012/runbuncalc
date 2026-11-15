const path = require('node:path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/main.tsx',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {extensions: ['.tsx', '.ts', '.js']},
  module: {
    rules: [{
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: {loader: 'ts-loader', options: {compilerOptions: {noEmit: false}}},
    }],
  },
  plugins: [new CopyPlugin({patterns: [
    {from: 'src/index.html'},
    {from: 'src/style.css'},
  ]})],
  devtool: 'source-map',
};
