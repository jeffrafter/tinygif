module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "dist/tinygif.js"
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
