const { lstatSync, readdirSync } = require('fs');
const path = require('path');

// This function generates configuration for files in the
// ./src/examples/ folder
const generateExampleEntries = function () {
  const src = './examples';

  // Get all subdirectories in the ./src/apps,
  // so we can just add a new folder there and
  // have automatically the entry points updated

  const getDirectories = source =>
    readdirSync(source)
      .map(name => path.resolve(source, name))
      .filter(s => lstatSync(s).isDirectory());

  const exampleDirs = getDirectories(src);

  return exampleDirs.reduce((entry, dir) => {
    entry['./' + path.basename(dir) + '/bundle'] = `${dir}/index`;

    return entry;
  }, {});
};

module.exports = {
  mode: 'development',

  entry: generateExampleEntries(),

  devServer: {
    contentBase: path.resolve(__dirname, 'examples'),
    publicPath: '/',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', { targets: { chrome: '60' } }],
            '@babel/preset-typescript',
          ],
        },
      },
    ],
  },

  resolve: {
    alias: {
      'react-resource-router': path.resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
};
