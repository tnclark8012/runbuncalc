const path = require('node:path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    settings: './src/main.tsx',
    calculator: './src/calculator.ts',
  },
  output: {
    filename: '[name].js',
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
    {from: '../dist', filter: file => path.basename(file) !== 'index.html'},
    {
      from: '../dist/index.html',
      to: 'index.html',
      force: true,
      priority: 10,
      transform(content) {
        const html = content.toString();
        const marker = '<body class="dark-theme">';
        if (!html.includes(marker)) throw new Error('Calculator body marker is missing.');
        return html.replace(marker, `${marker}
<aside id="app-controls" hidden style="padding: 1rem" aria-label="App controls">
  <a href="settings.html">App settings</a>
  <button id="app-sync" type="button">Sync</button>
  <span id="app-sync-status" role="status" aria-live="polite">Sync replaces existing collections. Save in the emulator first.</span>
</aside>
<script defer src="calculator.js"></script>`);
      },
    },
    {from: 'src/settings.html'},
    {from: 'src/style.css', to: 'app-settings.css'},
  ]})],
  devtool: 'source-map',
};
