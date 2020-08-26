const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',

  entry: './examples/index.tsx',
  devtool: 'inline-source-map',

  devServer: {
    contentBase: './dist',
  },

  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new HtmlWebpackPlugin({
      template: './examples/index.html',
      filename: 'index.html',
      inject: 'body',
    }),
  ],

  output: {
    filename: '[name].bundle.js',
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
