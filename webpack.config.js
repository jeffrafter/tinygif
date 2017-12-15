const path = require('path')

module.exports = {
  entry: "./src/tinygif.js",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "tinygif.js",
    library: "Tinygif",
    libraryTarget: "umd",
  },
  devServer: {
    contentBase: './dist'
  },
  module: {
    loaders: [
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: { inline: true }
      },
      {
        test: /[^worker]\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['env']
        }
      }
    ]
  }
}
