module.exports = {
  entry: "./src/canvas.js",
  output: {
    filename: "example/bundle.js",
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
