module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "index.js",
    library: "Tinygif",
    libraryTarget: "umd"
  },
  module: {
    loaders: [
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: { inline: true }
      }
    ]
  }
}
