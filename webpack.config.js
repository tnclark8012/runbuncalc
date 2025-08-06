const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/extensions/main.ts',
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
    filename: 'extensions.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};