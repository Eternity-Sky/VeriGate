const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/verigate.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'verigate.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './demo/index.html',
      filename: 'demo.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'netlify', to: 'netlify' },
        { from: 'demo/demo.html', to: 'index.html' }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    open: true
  }
};
