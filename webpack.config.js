module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "index.js"
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
